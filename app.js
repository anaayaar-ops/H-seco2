import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL,
    secret: process.env.U_PASS,
    targetBotId: 51660277, // معرف العضوية التي ترسل البونص
    actionWord: "صيد"       // الكلمة المراد إرسالها في الروم
};

const service = new WOLF();

service.on('ready', () => {
    console.log(`✅ المتصيد جاهز: ${service.currentSubscriber.nickname}`);
    console.log(`👀 مراقبة المعرف: ${settings.targetBotId}`);
});

service.on('privateMessage', async (message) => {
    const senderId = message.authorId || message.sourceSubscriberId;
    const content = message.content || "";

    // 1. التأكد أن الرسالة من الحساب المطلوب وأنها تحتوي على عبارة تدل على وجود "هبة" أو "بونص"
    // استخدمنا "available for you in" لأنها ثابتة في هذا النوع من الرسائل
    if (senderId === settings.targetBotId && content.includes("available for you in")) {
        
        console.log("📢 تم رصد رسالة بونص جديدة...");

        /* 2. استخراج رقم الروم باستخدام التعبير النمطي (Regex):
           - يبحث عن أول (ID متبوع بمسافة ثم أرقام داخل أقواس.
           - سيقوم بالتقاط 66266 ويتجاهل أي أرقام أخرى تأتي بعد "thanks to".
        */
        const match = content.match(/\(ID\s*(\d+)\)/);
        
        if (match && match[1]) {
            const roomId = parseInt(match[1]);
            console.log(`🎯 الهدف: غرفة رقم [${roomId}]`);

            try {
                // 3. تنفيذ أمر الصيد
                await service.messaging().sendGroupMessage(roomId, settings.actionWord);
                console.log(`🚀 تم الجلد في الروم ${roomId} بنجاح!`);
            } catch (err) {
                console.error(`❌ فشل الإرسال (تأكد من وجود البوت في الروم):`, err.message);
            }
        } else {
            console.log("⚠️ تعذر العثور على رقم الروم في نص الرسالة.");
        }
    }
});

service.login(settings.identity, settings.secret);
