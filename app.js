import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL,
    secret: process.env.U_PASS,
    targetBotId: 51660277, 
    actionWord: "صيد",
    delayBetweenHeists: 11000,
    workDuration: 54 * 60 * 1000, // 54 دقيقة عمل
    restDuration: 6 * 60 * 1000   // 6 دقائق راحة
};

const service = new WOLF();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let heistQueue = [];
let isProcessing = false;
let isResting = false; // متغير جديد للتحكم في وضع الراحة

// دالة معالجة الطابور
const processQueue = async () => {
    if (isProcessing || heistQueue.length === 0 || isResting) return;

    isProcessing = true;

    while (heistQueue.length > 0 && !isResting) {
        const roomId = heistQueue.shift();
        
        console.log(`⏳ انتظار الاستراحة بين الصيد... الروم: ${roomId}`);
        await sleep(settings.delayBetweenHeists);

        // إذا بدأت فترة الراحة أثناء الانتظار، نعيد الروم للطابور ونتوقف
        if (isResting) {
            heistQueue.unshift(roomId);
            break;
        }

        try {
            await service.groups.join(roomId).catch(() => {});
            await service.messaging.sendGroupMessage(roomId, settings.actionWord);
            console.log(`🚀 تم الصيد في [${roomId}]. المتبقي: ${heistQueue.length}`);
        } catch (err) {
            console.error(`❌ خطأ في الروم ${roomId}: ${err.message}`);
        }
    }

    isProcessing = false;
};

// --- نظام إدارة الوقت (54/6) ---
const manageWorkCycle = async () => {
    while (true) {
        console.log("🟢 [نظام الوقت] بدأت دورة الـ 54 دقيقة عمل.");
        isResting = false;
        processQueue(); // محاولة معالجة أي شيء عالق في الطابور

        await sleep(settings.workDuration);

        console.log("🛑 [نظام الوقت] بدأت دورة الـ 6 دقائق راحة. يتوقف الصيد الآن.");
        isResting = true;
        // سيقوم processQueue بالتوقف تلقائياً بسبب شرط isResting

        await sleep(settings.restDuration);
    }
};

service.on('ready', () => {
    console.log(`✅ المتصل: ${service.currentSubscriber.nickname}`);
    manageWorkCycle(); // بدء مراقبة الوقت فور الاتصال
});

service.on('message', async (message) => {
    if (!message.isGroup && (message.sourceSubscriberId === settings.targetBotId || message.authorId === settings.targetBotId)) {
        
        const content = message.body || message.content || "";
        const match = content.match(/\(ID\s*(\d+)\)/);
        
        if (match && match[1]) {
            const roomId = parseInt(match[1]);
            console.log(`📥 استلام روم جديد ${roomId}.`);
            
            heistQueue.push(roomId);
            
            // لا يبدأ المعالجة إلا إذا لم نكن في وقت راحة
            if (!isResting) {
                processQueue();
            } else {
                console.log("⏳ نحن في وقت الراحة، سيتم الصيد فور انتهاء الـ 6 دقائق.");
            }
        }
    }
});

service.login(settings.identity, settings.secret);
