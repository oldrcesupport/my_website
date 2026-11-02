# Production deployment draft — not yet validated

Reviewed against the current configuration on 2026-11-02.

This configuration is a starting point, not a claim of production readiness.
Validate it in an isolated staging environment first, including actual gateway
behaviour and recovery from interrupted payments.

**Payment blocker:** the publicly available [ZarinPal WooCommerce integration](https://github.com/ZarinPal-Lab/WordPress-WooCommerce/blob/master/zarinpal-woocommerce-payment-gateway/class-wc-gateway-zarinpal.php)
converts toman to rial for the request but shows a different conversion for
verification. This repository sends rial in both calls. That discrepancy has not
been resolved with current provider documentation. A local sandbox transaction
on 2026-11-02 did succeed with rial in both calls; see `ZARINPAL_SANDBOX.md`.
Keep live payments disabled until ZarinPal confirms the production contract and
the intended merchant configuration is independently verified.

1. Install Docker Engine/Compose and a host Nginx with TLS on Ubuntu. Copy
   `.env.production.example` to `.env.production` with restrictive permissions.
   Replace every placeholder with real values and a unique Django secret,
   PostgreSQL password and Fernet key. Keep both keys stable and backed up.
2. Set the public HTTPS URL and callback URL, `ALLOWED_HOSTS` (including the
   internal `gateway` host), `CSRF_TRUSTED_ORIGINS`, PostgreSQL fields and
   merchant ID. `LIVE_PAYMENTS_ENABLED` intentionally defaults to false; current
   production settings refuse to start until live payments are explicitly
   enabled and configured. Do not enable until gateway verification is complete.
3. Set up host TLS using a trusted certificate. Adapt
   `deploy/nginx-host.example.conf`, validate with `nginx -t`, and enable it.
   The container gateway binds only to host loopback port 8080; PostgreSQL and
   application containers have no published ports. Do not make the gateway
   publicly reachable: it trusts the host TLS proxy's network boundary.
4. Use `docker compose --env-file .env.production -f docker-compose.production.yml build`,
   then `docker compose --env-file .env.production -f docker-compose.production.yml up -d db`.
   Run migrations with `docker compose --env-file .env.production -f docker-compose.production.yml run --rm backend python manage.py migrate`.
   Run `collectstatic --noinput` in the same way, then start the stack with
   `docker compose --env-file .env.production -f docker-compose.production.yml up -d`.
   Create the first superuser with Django's interactive `createsuperuser`; set
   the real price and explicitly enable sales only after verification. Review
   `docker compose ... ps` and logs: the backend probe checks its database and
   the frontend probe checks its HTTP response; neither proves payment works.
5. Back up PostgreSQL using `docker compose ... exec -T db pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc > backup.dump`
   with the actual variables set in the shell. Store the dump and encryption key
   securely and separately. Test restoration into a separate empty database with
   `pg_restore` before relying on the backup. Do not restore over a live database
   without a tested maintenance and rollback plan.

For upgrades, back up and test migrations against a copy, deploy an immutable
image, and retain the previous image and a compatible database backup. Application
rollback alone does not reverse schema migrations. This draft has not been
validated through an actual TLS deployment, image build, restore, or load test.
