import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connecté (Node.js)"))
.catch(err => console.error("❌ MongoDB connexion erreur :", err.message));

export default mongoose;
