import hashlib
from datetime import datetime

from apps.business_time.services import BusinessTimeService
from apps.orders.models import OrderStatus
from apps.tickets.crypto import QRCryptoService
from apps.tickets.models import Ticket, TicketStatus
from django.db import transaction

from .models import CheckInRecord, CheckInResult


class CheckInService:
    @classmethod
    def redeem_ticket(
        cls,
        raw_token_or_url: str,
        staff_user=None,
        scanner_device_id: str = "",
        now_utc: datetime | None = None,
    ) -> tuple[str, str, Ticket | None, CheckInRecord | None, datetime | None]:
        """
        Atomically validates and redeems an entrance ticket in a single ACID transaction.
        Utilizes row-level locking (select_for_update) on the Ticket to guarantee that
        simultaneous scans on the same QR token result in exactly one successful redemption
        and one ALREADY_USED rejection.

        Returns: (result: CheckInResult, message: str, ticket: Ticket, record: CheckInRecord, used_at: datetime)
        """
        raw_input = raw_token_or_url.strip()

        # Normalize Persian/Arabic digits to English
        persian_digits = "۰۱۲۳۴۵۶۷۸۹"
        arabic_digits = "٠١٢٣٤٥٦٧٨٩"
        for i in range(10):
            raw_input = raw_input.replace(persian_digits[i], str(i)).replace(arabic_digits[i], str(i))

        # If full verification URL was scanned, extract the token segment
        if "/verify/" in raw_input:
            raw_input = raw_input.split("/verify/")[-1].strip().rstrip("/")
            if "?" in raw_input:
                raw_input = raw_input.split("?")[0].strip()
            if "#" in raw_input:
                raw_input = raw_input.split("#")[0].strip()

        token_hash = QRCryptoService.hash_token(raw_input)
        now = now_utc or BusinessTimeService.get_now_utc()

        with transaction.atomic():
            ticket_qs = Ticket.objects.select_for_update().select_related("order")

            # 1. Lookup by QR token hash (primary for camera scan)
            ticket = ticket_qs.filter(qr_token_hash=token_hash).first()

            # 2. Lookup by ticket serial number (primary for manual staff input, e.g. TKT-20261031-XXXXXX)
            if not ticket:
                ticket = ticket_qs.filter(ticket_number__iexact=raw_input).first()

            # 3. Lookup by ticket public UUID
            if not ticket:
                try:
                    ticket = ticket_qs.filter(public_id=raw_input).first()
                except Exception:
                    pass

            if not ticket:
                record = CheckInRecord.objects.create(
                    ticket=None,
                    staff_user=staff_user,
                    result=CheckInResult.INVALID_TOKEN,
                    scanner_device_id=scanner_device_id,
                    notes=f"sha256:{hashlib.sha256(raw_input.encode()).hexdigest()[:16]}",
                )
                return (
                    CheckInResult.INVALID_TOKEN,
                    "بارکد اسکن‌شده نامعتبر است و در سامانه یافت نشد.",
                    None,
                    record,
                    None,
                )

            # Check if ticket was already used
            if ticket.status == TicketStatus.USED or ticket.used_at is not None:
                record = CheckInRecord.objects.create(
                    ticket=ticket,
                    staff_user=staff_user,
                    result=CheckInResult.ALREADY_USED,
                    scanner_device_id=scanner_device_id,
                    notes=f"Previously used at {ticket.used_at}",
                )
                return (
                    CheckInResult.ALREADY_USED,
                    f"این بلیت قبلاً در ساعت {ticket.used_at.strftime('%H:%M:%S')} پذیرش شده است و امکان استفاده مجدد ندارد.",
                    ticket,
                    record,
                    ticket.used_at,
                )

            # Check if ticket was cancelled
            if ticket.status == TicketStatus.CANCELLED:
                record = CheckInRecord.objects.create(
                    ticket=ticket,
                    staff_user=staff_user,
                    result=CheckInResult.CANCELLED,
                    scanner_device_id=scanner_device_id,
                )
                return (
                    CheckInResult.CANCELLED,
                    "این بلیت توسط مدیریت لغو شده است.",
                    ticket,
                    record,
                    None,
                )

            # Check if parent order is confirmed paid
            if ticket.order.status != OrderStatus.PAID:
                record = CheckInRecord.objects.create(
                    ticket=ticket,
                    staff_user=staff_user,
                    result=CheckInResult.ORDER_UNPAID,
                    scanner_device_id=scanner_device_id,
                )
                return (
                    CheckInResult.ORDER_UNPAID,
                    "سفارش مربوط به این بلیت پرداخت نشده است.",
                    ticket,
                    record,
                    None,
                )

            # Check date and time validity window
            if now > ticket.valid_until:
                record = CheckInRecord.objects.create(
                    ticket=ticket,
                    staff_user=staff_user,
                    result=CheckInResult.EXPIRED,
                    scanner_device_id=scanner_device_id,
                    notes=f"Expired at {ticket.valid_until}",
                )
                return (
                    CheckInResult.EXPIRED,
                    "اعتبار این بلیت منقضی شده است (مربوط به روز کاری گذشته).",
                    ticket,
                    record,
                    None,
                )

            if now < ticket.valid_from:
                record = CheckInRecord.objects.create(
                    ticket=ticket,
                    staff_user=staff_user,
                    result=CheckInResult.EXPIRED,
                    scanner_device_id=scanner_device_id,
                    notes=f"Not yet valid before {ticket.valid_from}",
                )
                return (
                    CheckInResult.EXPIRED,
                    "بلیت هنوز فعال نشده است.",
                    ticket,
                    record,
                    None,
                )

            # Success: Mark as permanently USED
            ticket.status = TicketStatus.USED
            ticket.used_at = now
            ticket.save(update_fields=["status", "used_at"])

            record = CheckInRecord.objects.create(
                ticket=ticket,
                staff_user=staff_user,
                result=CheckInResult.SUCCESS,
                scanner_device_id=scanner_device_id,
            )

            return (
                CheckInResult.SUCCESS,
                "ورود مجاز است. خوش آمدید!",
                ticket,
                record,
                now,
            )
