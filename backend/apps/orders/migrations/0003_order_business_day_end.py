from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("orders", "0002_order_encrypted_guest_token_order_frontend_origin")]

    operations = [
        migrations.AddField(
            model_name="order",
            name="business_day_end",
            field=models.DateTimeField(blank=True, null=True, verbose_name="پایان روز کاری هنگام ثبت سفارش"),
        ),
    ]
