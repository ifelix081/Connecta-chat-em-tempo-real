const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB conectado');
    } catch (err) {
        console.error('Falha na conexao com o banco:', err.message);
        process.exit(1); //fecha se nao conecta
    }
};

module.exports = connectDB;