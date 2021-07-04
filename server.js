import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import mongoData from "./mongoData.js"
import Pusher from "pusher"
//App config.

const app=express();
const port=process.env.PORT || 7000;
const url="mongodb+srv://admin:admin@cluster0.nihhw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
const pusher = new Pusher({
    appId: "1178439",
    key: "1f59c18f524aa570e767",
    secret: "66983b451de4063f1419",
    cluster: "ap2",
    useTLS: true
  });
//Middlewares
app.use(express.json())
app.use(cors())

//DB config
mongoose.connect(url,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology:true
},()=>{
    console.log("Connected")
})
mongoose.connection.once('open',()=>{
    console.log("DB Connected")

    const changeStream=mongoose.connection.collection('conversations').watch()
    changeStream.on('change',(change)=>{
        if(change.operationType==='insert'){
            pusher.trigger('channels','newChannel',{
                'change':change
            });
        }
        else if(change.operationType==='update'){
            pusher.trigger('conversations','newMessage',{
                'change':change
            });
        }
        else{
            console.log('Error triggering Pusher')
        }
    })
})

//Api routes
app.get('/',(_,res)=>{
    res.send("hii")
})
app.post('/new/channel',(req,res)=>{
    const dbData=req.body;
    mongoData.create(dbData,(err,data)=>{
        if(err){
            res.status(500).send(err)
        }
        else{
            res.status(201).send(data)
        }
    })
});

app.get('/get/channelList',(req,res)=>{
    mongoData.find((err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            const channels=[]
            data.map((channelData)=>{
                const channelInfo={
                    id:channelData._id,
                    name:channelData.channelName
                }
                channels.push(channelInfo)
            })
            res.status(200).send(channels)
        }
    })
})
app.post('/new/message',(req, res)=>{
    const newMessage=req.body
    mongoData.update({_id:req.query.id},
        {$push:{conversation:req.body}},
        (err,data)=>{
            if(err){
                res.status(500).send(err)
            }
            else{
                res.send(data)
            }
        }
    )
    })
app.get('/get/data',(req,res)=>{
    mongoData.find((err,data)=>{
        if(err){
            res.status(500).send(err)
        }
        else{
            res.status(201).send(data)
        }
    })
})
app.get('/get/conversation',(req,res)=>{
    const id=req.query.id;
    mongoData.find({_id:id},(err, data)=>{
        if(err){
            res.status(500).send(err)
        }
        else{
            res.status(201).send(data)
        }
    })
})

//Listenner
app.listen(port,()=>{
    console.log(`Listing on ${port}` )
}
)
