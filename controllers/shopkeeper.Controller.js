export async function becomeShopkeeper(req, res) {
  try {
    const user = req.user;
    const { shop_name, address, phone } = req.body;

    // Save shop request
    const { error } = await req.supabase
      .from("shopkeepers")
      .insert([{ user_id: user.id, shop_name, address, phone, status: "pending" }]);

    if (error) return res.status(400).json({ error });

    res.json({ success: true, message: "Shopkeeper request submitted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}
