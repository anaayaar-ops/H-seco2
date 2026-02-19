import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL,
    secret: process.env.U_PASS,
    targetBotId: 51660277, 
    actionWord: "صيد",
    delayBetweenHeists: 11000,      // 11 ثانية بين كل صيد
    workDuration: 54 * 60 * 1000,   // 54 دقيقة عمل
    restDuration: 6 * 60 * 1000     // 6 دقائق راحة
};

const service = new WOLF();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let heistQueue = [];
let isProcessing = false;
let isResting = false;

// دالة معالجة الطابور
const processQueue = async () => {
    if (isProcessing || heistQueue.length === 0 || isResting) return;

    isProcessing = true;

    while (heistQueue.length > 0 && !isResting) {
        const roomId = heistQueue.shift();
        
        console.log(`⏳ انتظار الاستراحة بين الصيد... الروم: ${roomId}`);
        await sleep(settings.delayBetweenHeists);

        if (isResting) {
            heistQueue.unshift(roomId); // إعادة الروم للطابور إذا بدأت الراحة فجأة
            break;
        }

        try {
            // تصحيح: استخدام group بدلاً من groups
            await service.group.join(roomId).catch(() => {});
            
            await service.messaging.sendGroupMessage(roomId, settings.actionWord);
            console.log(`🚀 [${new Date().toLocaleTimeString('ar-SA')}] تم الصيد في [${roomId}]. المتبقي: ${heistQueue.length}`);
        } catch (err) {
            console.error(`❌ فشل الصيد في الروم ${roomId}: ${err.message}`);
        }
    }

    isProcessing = false;
};

// نظام إدارة الوقت (54 دقيقة عمل / 6 دقائق راحة)
const manageWorkCycle = async () => {
    while (true) {
        console.log("🟢 [نظام الوقت] بدأت دورة الـ 54 دقيقة عمل.");
        isResting = false;
        processQueue(); 

        await sleep(settings.workDuration);

        console.log("🛑 [نظام الوقت] بدأت دورة الـ 6 دقائق راحة. يتوقف الصيد مؤقتاً.");
        isResting = true;
        
        await sleep(settings.restDuration);
    }
};

service.on('ready', () => {
    console.log(`✅ البوت متصل: ${service.currentSubscriber.nickname}`);
    manageWorkCycle(); 
});

service.on('message', async (message) => {
    // التحقق من الرسائل الخاصة من البوت المستهدف
    if (!message.isGroup && (message.sourceSubscriberId === settings.targetBotId || message.authorId === settings.targetBotId)) {
        
        const content = message.body || message.content || "";
        const match = content.match(/\(ID\s*(\d+)\)/);
        
        if (match && match[1]) {
            const roomId = parseInt(match[1]);
            console.log(`📥 إضافة الروم ${roomId} إلى الطابور...`);
            
            heistQueue.push(roomId);
            
            if (!isResting) {
                processQueue();
            } else {
                console.log(`⏳ تم تخزين الروم ${roomId}؛ سيتم الصيد بعد انتهاء الـ 6 دقائق راحة.`);
            }
        }
    }
});

service.login(settings.identity, settings.secret);
