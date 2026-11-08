# Payment Window and Receipt Testing

## What was added

- A complete simulated rent-payment dialog with Card and Bank Account options.
- Client-side validation, loading state, errors, and a success confirmation.
- A unique receipt number for every successful payment.
- A printable receipt page with **Print / Save as PDF**.
- Receipt links in the tenant payment-history table.
- An HTML receipt email sent to the tenant after payment.
- The manager's transaction list is updated automatically through the existing rent-payment transaction integration.

## Test payment details

This is a demo flow; no real payment is processed.

Use:

- Card number: `4242 4242 4242 4242`
- Expiry: any value such as `12/30`
- CVC: any 3 digits such as `123`

Only the final four digits are sent to and stored by the server. The complete card number, expiry, and CVC are never stored.

## Receipt email setup

Add these values to `.env`:

```env
RESEND_API_KEY=re_your_key
EMAIL_FROM=PropFusion <your-verified-sender@yourdomain.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For Resend test mode, sending may be restricted to the email address connected to the Resend account. Verify a sender/domain in Resend before sending to arbitrary tenant addresses.

Without `RESEND_API_KEY`, payment still succeeds and the receipt remains available in the dashboard, but no email is actually sent.

## Testing steps

1. Start the app and sign in as the tenant.
2. Ensure there is no paid payment for the current calendar month. The application intentionally allows only one paid rent record per lease and month.
3. Click **Pay Rent**.
4. Fill in the simulated payment fields and check the authorization box.
5. Click the payment button.
6. Confirm that:
   - the success screen displays a receipt number;
   - **View receipt** opens a printable receipt;
   - the payment appears in Payment history;
   - a matching revenue transaction appears for the manager;
   - the tenant receives the email when Resend is configured.
