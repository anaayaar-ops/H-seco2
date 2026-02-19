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
    console.log(`✅ البوت متصل باسم: ${service.currentSubscriber.nickname}`);
    console.log(`👀 مراقبة الحساب: ${settings.targetBotId}`);
});

// استخدام حدث الرسالة العام لضمان عدم تفويت أي شيء
service.on('message', async (message) => {
    // التأكد أنها رسالة خاصة (Private) ومن الحساب المطلوب
    if (!message.isGroup && message.sourceSubscriberId === settings.targetBotId) {
        
        // محاولة استخراج النص من أي مكان ممكن في الرسالة
        const content = message.body || message.content || (message.embed ? message.embed.description : "") || "";
        
        console.log(`📩 وصل نص جديد: [${content}]`);

        // فحص وجود كلمة Bonus أو Heist أو available (تجاهل حالة الأحرف)
        if (/bonus|heist|available|ID/i.test(content)) {
            
            // استخراج رقم الغرفة (أول ID يظهر)
            const match = content.match(/\(ID\s*(\d+)\)/);
            
            if (match && match[1]) {
                const roomId = parseInt(match[1]);
                console.log(`🎯 هدف محدد! غرفة: ${roomId}`);

                try {
                    // الانضمام والإرسال
                    await service.groups().join(roomId);
                    await service.messaging().sendGroupMessage(roomId, settings.actionWord);
                    console.log(`🚀 تم الصيد بنجاح في ${roomId}`);
                } catch (err) {
                    console.error(`❌ فشل التنفيذ: ${err.message}`);
                }
            }
        }
    }
});

service.login(settings.identity, settings.secret);
