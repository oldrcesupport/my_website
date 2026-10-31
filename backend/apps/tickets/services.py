import base64
import io
import uuid

import qrcode
from apps.business_time.services import BusinessTimeService
from apps.orders.models import Order
from django.db import transaction

from .crypto import QRCryptoService
from .models import Ticket, TicketStatus


class TicketService:
    @classmethod
    def generate_ticket_number(cls, business_date) -> str:
        date_str = business_date.strftime("%Y%m%d")
        random_suffix = uuid.uuid4().hex[:6].upper()
        return f"TKT-{date_str}-{random_suffix}"

    @classmethod
    def issue_tickets_for_order(cls, order: Order, paid_at=None) -> list[Ticket]:
        """
        Atomically issues exactly order.quantity separate Ticket records,
        each with its own independent, unpredictable QR credential.
        """
        if order.tickets.exists():
            return list(order.tickets.all())

        now_utc = paid_at or BusinessTimeService.get_now_utc()
        valid_until_utc = BusinessTimeService.get_business_day_boundary_utc(
            order.business_date
        )

        tickets_to_create = []
        with transaction.atomic():
            for _ in range(order.quantity):
                raw_token = QRCryptoService.generate_token()
                token_hash = QRCryptoService.hash_token(raw_token)
                encrypted_token = QRCryptoService.encrypt_token(raw_token)
                ticket_number = cls.generate_ticket_number(order.business_date)

                ticket = Ticket(
                    order=order,
                    ticket_number=ticket_number,
                    qr_token_hash=token_hash,
                    encrypted_qr_token=encrypted_token,
                    status=TicketStatus.ISSUED,
                    business_date=order.business_date,
                    valid_from=now_utc,
                    valid_until=valid_until_utc,
                )
                tickets_to_create.append(ticket)

            created_tickets = Ticket.objects.bulk_create(tickets_to_create)

        return created_tickets

    @classmethod
    def render_qr_image_bytes(
        cls, payload: str, box_size: int = 10, border: int = 2
    ) -> bytes:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=box_size,
            border=border,
        )
        qr.add_data(payload)
        qr.make(fit=True)

        img = qr.make_image(fill_color="#203D33", back_color="#FFFCF6")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return buffer.getvalue()

    @classmethod
    def render_qr_data_uri(cls, payload: str) -> str:
        img_bytes = cls.render_qr_image_bytes(payload)
        b64 = base64.b64encode(img_bytes).decode("ascii")
        return f"data:image/png;base64,{b64}"
