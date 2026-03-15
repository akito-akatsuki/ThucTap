export async function sendZaloMessage(message) {
  const accessToken = process.env.ZALO_ACCESS_TOKEN;
  const userId = process.env.ZALO_USER_ID;

  await fetch("https://openapi.zalo.me/v3.0/oa/message/cs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: accessToken,
    },
    body: JSON.stringify({
      recipient: {
        user_id: userId,
      },
      message: {
        text: message,
      },
    }),
  });
}
