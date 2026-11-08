# Tenant payment history and support testing

## Added

- Tenant payment search by receipt, amount, method, status, last four digits, payer, or date.
- Month and year filters with a clear-filters button.
- Payment period column and result count.
- Customer Support link from the tenant dashboard.
- FAQ page and support request form.
- Support requests stored in MongoDB collection `supportRequests`.
- Acknowledgement email to the tenant with a 2–3 business day response notice.
- Notification email to the manager.
- Every successful payment is written to `payments`, `transactions`, and the lease's `paymentHistory` snapshot.
- Manager lease details load the current payment history directly from `payments`.

## Email configuration

Add these values to your local `.env`:

```env
RESEND_API_KEY=
EMAIL_FROM=PropFusion <your-verified-sender@yourdomain.com>
MANAGEMENT_SUPPORT_EMAIL=aditya.tambe.professional31@gmail.com
MANAGEMENT_SUPPORT_PHONE=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Without `RESEND_API_KEY`, requests and payments still save successfully. Email contents are printed in the server terminal instead of being delivered.

## Test

1. Sign in as `tambeaditya22@gmail.com`.
2. Open `/tenant/dashboard`.
3. Test search, month, and year filters in Payment history.
4. Open Customer support.
5. Submit a request and verify `supportRequests` in MongoDB.
6. Check the tenant and manager inboxes when Resend is configured.
7. Make a new-month payment or remove the existing current-month test payment.
8. Sign in as the manager and open the related lease. Its Payment history should show the same payment.
