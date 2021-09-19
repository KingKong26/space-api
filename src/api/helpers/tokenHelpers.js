const { Timestamp } = require("mongodb");
const collections = require("../../../src/config/collection"),
  db = require("../../../src/config/dbConnection");


module.exports = {
    getSample:()=>{
        return new Promise(async(resolve,reject)=>{
            try{

                console.log(db.getDb(),"db")
                const wait = await db.getDb().collection(collections.SAMPLE).find({}).toArray()
                console.log(wait);
                resolve(wait)
            }catch(err){
                console.log(err)
                reject(err)
            }
        })
    },
    storeRefreshTokens:(token)=>{
        return new Promise(async(resolve,reject)=>{
            try{
                await db.getDb().collection(collections.TOKEN).insertOne({...token,createdAt:new Date()})
                resolve()
            }catch(err){
                console.log(err)
                reject(err)
            }
        })
    }
}