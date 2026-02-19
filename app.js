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
    // التحقق من الرسالة الخاصة من المصدر المطلوب
    if (!message.isGroup && (message.sourceSubscriberId === settings.targetBotId || message.authorId === settings.targetBotId)) {
        
        const content = message.body || message.content || "";
        console.log(`📩 وصل نص جديد: [${content}]`);

        // البحث عن المعرف (ID) داخل الأقواس
        const match = content.match(/\(ID\s*(\d+)\)/);
        
        if (match && match[1]) {
            const roomId = parseInt(match[1]);
            console.log(`🎯 محاولة الصيد في الروم: ${roomId}`);

            try {
                // محاولة الانضمام للغرفة (استدعاء مباشر للمقطع)
                await service.groups.join(roomId);
                console.log(`✅ تم الانضمام للروم ${roomId}`);
            } catch (joinErr) {
                // إذا فشل الانضمام ربما البوت موجود بالفعل، نكمل للإرسال
                console.log(`ℹ️ تنبيه عند الانضمام: ${joinErr.message}`);
            }

            try {
                // محاولة الإرسال (استدعاء مباشر للمقطع دون أقواس)
                await service.messaging.sendGroupMessage(roomId, settings.actionWord);
                console.log(`🚀 تم إرسال [${settings.actionWord}] بنجاح!`);
            } catch (sendErr) {
                console.error(`❌ فشل الإرسال النهائي: ${sendErr.message}`);
            }
        }
    }
});

service.login(settings.identity, settings.secret);
