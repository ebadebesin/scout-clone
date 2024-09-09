import nodemailer from "nodemailer";

export async function POST(req) {
  const { name, email, message } = await req.json();

  // Create a transporter object with your email credentials
  const transporter = nodemailer.createTransport({
    service: "gmail", // You can use any other email provider (e.g., Outlook, Yahoo, etc.)
    auth: {
      user: process.env.EMAIL_USER, // Your email address
      pass: process.env.EMAIL_PASS, // Your email password
    },
  });

  try {
    // Send the email
    await transporter.sendMail({
      from: email,
      to: process.env.EMAIL_USER, // Your email address to receive messages
      subject: `Contact form submission from ${name}`,
      text: message,
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Message:</strong> ${message}</p>`,
    });

    return new Response(JSON.stringify({ message: "Email sent successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({ message: "Error sending email", error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
