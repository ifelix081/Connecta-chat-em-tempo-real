var mongoose = require('mongoose');

var connectDB = async function() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB conectado');
  } catch (err) {
    console.error('Erro ao conectar no banco: ' + err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
