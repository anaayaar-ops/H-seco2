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
    console.log(`✅ البوت متصل ومستعد: ${service.currentSubscriber.nickname}`);
});

service.on('message', async (message) => {
    // التأكد أنها رسالة خاصة ومن الحساب المطلوب
    if (!message.isGroup && message.sourceSubscriberId === settings.targetBotId) {
        
        const content = message.body || message.content || "";
        console.log(`📩 وصل نص جديد: [${content}]`);

        if (content.includes("ID")) {
            // استخراج أول ID (رقم الغرفة)
            const match = content.match(/\(ID\s*(\d+)\)/);
            
            if (match && match[1]) {
                const roomId = parseInt(match[1]);
                console.log(`🎯 محاولة الصيد في الروم: ${roomId}`);

                try {
                    // تصحيح طريقة الانضمام: استخدام () بعد group أو استدعاء مباشر حسب الإصدار
                    if (typeof service.group === 'function') {
                        await service.group().join(roomId);
                    } else if (service.groups && typeof service.groups().join === 'function') {
                        await service.groups().join(roomId);
                    }

                    // تصحيح طريقة الإرسال
                    await service.messaging().sendGroupMessage(roomId, settings.actionWord);
                    
                    console.log(`🚀 تم الانضمام والإرسال بنجاح في [${roomId}]`);
                } catch (err) {
                    console.error(`❌ فشل أثناء التنفيذ: ${err.message}`);
                    
                    // محاولة أخيرة للإرسال مباشرة في حال كان البوت بالروم أصلاً
                    try {
                        await service.messaging().sendGroupMessage(roomId, settings.actionWord);
                    } catch (e) {}
                }
            }
        }
    }
});

service.login(settings.identity, settings.secret);
