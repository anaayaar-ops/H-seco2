import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL,
    secret: process.env.U_PASS,
    targetBotId: 51660277, 
    actionWord: "صيد"
};

const service = new WOLF();

service.on('ready', () => {
    console.log("------------------------------------------");
    console.log(`✅ البوت متصل: ${service.currentSubscriber.nickname}`);
    console.log(`📡 يراقب البونص من: ${settings.targetBotId}`);
    console.log("------------------------------------------");
});

service.on('privateMessage', async (message) => {
    const senderId = message.authorId || message.sourceSubscriberId;
    const content = message.content || "";

    // التحقق من أن الرسالة من الحساب المطلوب وتحتوي على كلمة Bonus أو Heist
    if (senderId === settings.targetBotId && /bonus|heist|available/i.test(content)) {
        
        console.log(`📥 رسالة جديدة: ${content}`);

        // استخراج أول رقم ID يظهر في الرسالة (وهو رقم الغرفة)
        const match = content.match(/\(ID\s*(\d+)\)/);
        
        if (match && match[1]) {
            const roomId = parseInt(match[1]);
            console.log(`🎯 تم تحديد الغرفة: ${roomId}`);

            try {
                // 1. الانضمام للغرفة أولاً (ضروري جداً إذا لم يكن البوت فيها)
                await service.groups().join(roomId);
                console.log(`✅ تم الانضمام للغرفة ${roomId}`);

                // 2. إرسال كلمة الصيد
                await service.messaging().sendGroupMessage(roomId, settings.actionWord);
                console.log(`🚀 تم إرسال [${settings.actionWord}] بنجاح!`);
                
            } catch (err) {
                console.error(`❌ حدث خطأ: ${err.message}`);
            }
        } else {
            console.log("⚠️ لم يتم العثور على ID الغرفة في النص.");
        }
    }
});

service.login(settings.identity, settings.secret);
