import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL,
    secret: process.env.U_PASS,
    targetBotId: 51660277, 
    actionWord: "صيد",
    delayBetweenHeists: 11000 // 11 ثانية فاصل بين كل صيد وصيد
};

const service = new WOLF();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// مصفوفة لتخزين المهام (الطابور)
let heistQueue = [];
let isProcessing = false;

// دالة معالجة الطابور
const processQueue = async () => {
    if (isProcessing || heistQueue.length === 0) return;

    isProcessing = true;

    while (heistQueue.length > 0) {
        const roomId = heistQueue.shift(); // سحب أول غرفة في الطابور
        
        console.log(`⏳ انتظار ${settings.delayBetweenHeists / 1000} ثانية قبل الصيد في الروم: ${roomId}`);
        await sleep(settings.delayBetweenHeists);

        try {
            // الدخول للروم
            try {
                await service.groups.join(roomId);
            } catch (e) { /* تجاهل خطأ الدخول إذا كان البوت موجوداً أصلاً */ }

            // إرسال الكلمة
            await service.messaging.sendGroupMessage(roomId, settings.actionWord);
            console.log(`🚀 تم الصيد بنجاح في [${roomId}]. المتبقي في الطابور: ${heistQueue.length}`);
        } catch (err) {
            console.error(`❌ فشل الصيد في الروم ${roomId}: ${err.message}`);
        }
    }

    isProcessing = false;
    console.log("✅ انتهى الطابور، البوت في وضع الاستعداد...");
};

service.on('ready', () => {
    console.log(`✅ البوت متصل بنظام الطابور: ${service.currentSubscriber.nickname}`);
});

service.on('message', async (message) => {
    // التحقق من الرسالة الخاصة من المصدر المطلوب
    if (!message.isGroup && (message.sourceSubscriberId === settings.targetBotId || message.authorId === settings.targetBotId)) {
        
        const content = message.body || message.content || "";
        const match = content.match(/\(ID\s*(\d+)\)/);
        
        if (match && match[1]) {
            const roomId = parseInt(match[1]);
            console.log(`📥 إضافة الروم ${roomId} إلى الطابور...`);
            
            // إضافة رقم الروم للطابور
            heistQueue.push(roomId);
            
            // بدء معالجة الطابور (إذا لم يكن يعمل حالياً)
            processQueue();
        }
    }
});

service.login(settings.identity, settings.secret);
