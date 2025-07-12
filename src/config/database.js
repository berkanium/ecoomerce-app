const mongoose = require("mongoose");
/*
 *Mongoose ile mongodb bağlantısı yapılır.
 *
 */

const connectDB = async () => {
    try {
        const conn= await mongoose.connect(process.env.MONGODB_URI,{
            //Yeni mongodb driver ayarlar.
            useNewUrlParser:true,
            useUnifiedTopology:true
        })

        console.log(`Mongodb connection is successfuly: ${conn.connection.host}`);

        //mongodb olaylarını dinlemk için
        mongoose.connection.on("error",(err)=>{
            console.log(`MongoDB connection error: ${err}`);
            
        })

        mongoose.connection.on("disconnected",()=>{
            console.log(`MongoDB connection is down.`);
            
        });

    } catch (error) {
        console.log(`MongoDB connection error: ${error.message}`);
    }

};


module.exports= connectDB;