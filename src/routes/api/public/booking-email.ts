import { createFileRoute } from "@tanstack/react-router";
import {
  normalizeBookingEmailPayload,
  sendBookingEmail,
  type BookingEmailAction,
  type BookingEmailPayload,
} from "@/lib/email";

const VALID_ACTIONS: BookingEmailAction[] = ["booking_received", "booking_approved", "booking_rejected"];

export const Route = createFileRoute("/api/public/booking-email")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as Partial<BookingEmailPayload>;
          const payload = normalizeBookingEmailPayload(body);

          const action = payload.action;
          if (!action || !VALID_ACTIONS.includes(action)) {
            return new Response(JSON.stringify({ error: "Invalid email action" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (!payload.guest_name || !payload.email || !payload.check_in || !payload.check_out) {
            return new Response(JSON.stringify({ error: "Missing required booking fields" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          await sendBookingEmail(payload);

          return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("booking-email failed", error);
          return new Response(
            JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Email send failed" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
