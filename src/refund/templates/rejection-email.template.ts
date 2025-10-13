export const getRejectionEmailTemplate = (data: {
  customerName: string;
  treatmentPeriod: number;
  specificReasons: string;
}) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Refund Request Update - Traya</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            color: #333333;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #ffffff;
            letter-spacing: 2px;
        }
        .content {
            padding: 40px 30px;
            line-height: 1.8;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #333333;
            margin-bottom: 20px;
        }
        .intro {
            font-size: 15px;
            color: #555555;
            margin-bottom: 25px;
        }
        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #667eea;
            margin: 30px 0 15px 0;
            border-left: 4px solid #667eea;
            padding-left: 15px;
        }
        .reason-box {
            background-color: #f8f9fa;
            border-left: 4px solid #dc3545;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .reason-text {
            font-size: 15px;
            color: #333333;
            line-height: 1.8;
        }
        .highlight {
            background-color: #fff3cd;
            padding: 3px 8px;
            border-radius: 3px;
            font-weight: 600;
        }
        .support-box {
            background-color: #e7f3ff;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
        }
        .footer-text {
            font-size: 13px;
            color: #777777;
            line-height: 1.6;
        }
        .policy-link {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }
        .policy-link:hover {
            text-decoration: underline;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #667eea;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            margin-top: 20px;
        }
        .button:hover {
            background-color: #5568d3;
        }
        @media only screen and (max-width: 600px) {
            .content {
                padding: 30px 20px;
            }
            .header {
                padding: 30px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="logo">TRAYA</div>
        </div>

        <!-- Main Content -->
        <div class="content">
            <div class="greeting">Dear ${data.customerName},</div>

            <div class="intro">
                Thank you for taking the time to speak with us regarding your refund request.
                As discussed on the call, our team has carefully reviewed your case, including a
                thorough assessment by our dermatologist. Based on the Money Back Guarantee
                eligibility criteria, we regret to inform you that we will not be able to process
                a refund for your case.
            </div>

            <!-- Reason Section -->
            <div class="section-title">Reasons for Refund Denial</div>

            <div class="reason-box">
                <div class="reason-text">
                    Upon reviewing your case, we would like to inform you that refunds are applicable
                    only if <span class="highlight">all recommended kits for the entire eligibility period
                    are purchased and used within the advised timeline</span>. This is to ensure that the
                    treatment regimen is completed as recommended, which is essential for evaluating its
                    effectiveness.
                </div>
            </div>

            <div class="reason-box">
                <div class="reason-text">
                    ${data.specificReasons}
                </div>
            </div>

            <!-- Support Section -->
            <div class="support-box">
                <div class="reason-text">
                    We understand this may not be the outcome you were hoping for, and we truly appreciate
                    your patience throughout the review process. Please note that our refund policy is
                    designed to ensure fairness while maintaining the effectiveness of the treatment.
                    <br><br>
                    We remain committed to supporting your hair health journey. If you need any assistance
                    in continuing treatment or exploring alternative options, please feel free to reach out.
                </div>
            </div>

            <!-- Policy Link -->
            <div style="text-align: center; margin-top: 30px;">
                <a href="https:
                    View Money-Back Guarantee Policy
                </a>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-text">
                <strong>Team Traya</strong><br>
                Supporting Your Hair Health Journey<br><br>

                If you have any questions, please contact us:<br>
                Email: support@traya.health<br>
                Phone: 1800-XXX-XXXX<br><br>

                <a href="https:
                    Money-Back Guarantee Policy
                </a>
            </div>
        </div>
    </div>
</body>
</html>
`;
};

export const getRejectionEmailPlainText = (data: {
  customerName: string;
  treatmentPeriod: number;
  specificReasons: string;
}) => {
  return `Dear ${data.customerName},

Thank you for taking the time to speak with us regarding your refund request. As discussed on the call, our team has carefully reviewed your case, including a thorough assessment by our dermatologist. Based on the Money Back Guarantee eligibility criteria, we regret to inform you that we will not be able to process a refund for your case.

Reasons for Refund Denial:

Upon reviewing your case, we would like to inform you that refunds are applicable only if all recommended kits for the entire eligibility period are purchased and used within the advised timeline. This is to ensure that the treatment regimen is completed as recommended, which is essential for evaluating its effectiveness.

${data.specificReasons}

We understand this may not be the outcome you were hoping for, and we truly appreciate your patience throughout the review process. Please note that our refund policy is designed to ensure fairness while maintaining the effectiveness of the treatment. We remain committed to supporting your hair health journey. If you need any assistance in continuing treatment or exploring alternative options, please feel free to reach out.

If you have any further concerns, you can refer to our Money-Back Guarantee policy here: https:

Best regards,
Team Traya

---
Email: support@traya.health
Phone: 1800-XXX-XXXX
`;
};

