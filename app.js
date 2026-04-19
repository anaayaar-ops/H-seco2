import 'dotenv/config';
import wolfjs from 'wolf.js';
const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL,
    secret: process.env.U_PASS,
    targetRoomId: 224, // الروم الذي سيتم إرسال الأمر فيه
    monitorId: 76023180 // العضوية المستهدفة للمراقبة (الخاص)
};

const service = new WOLF();

// --- محرك المراقبة والاستخراج ---
service.on('message', async (message) => {
    try {
        // التأكد من أن الرسالة خاصة ومن العضوية المطلوبة فقط
        if (!message.isGroup && (message.sourceSubscriberId === settings.monitorId || message.authorId === settings.monitorId)) {
            
            const content = message.body || "";
            
            // البحث عن نمط رسالة الهجوم واستخراج ما بين علامات التنصيص
            // التعبير النمطي يبحث عن النص المحصور بين " " بدقة
            const attackMatch = content.match(/تعرضتم لهجوم من "([^"]+)"/);
            
            if (attackMatch && attackMatch[1]) {
                const attackerName = attackMatch[1]; // الاسم بالزخرفة والتشكيل كما هو
                
                console.log(`🎯 تم رصد هجوم! المهاجم: ${attackerName}`);
                
                // صياغة الأمر المطلوب
                const command = `!مد تحالف حالة ${attackerName}`;
                
                // إرسال الأمر إلى الروم المحدد
                await service.messaging.sendGroupMessage(settings.targetRoomId, command);
                
                console.log(`🚀 تم إرسال الأمر بنجاح في روم ${settings.targetRoomId}`);
            }
        }
    } catch (err) {
        console.error("❌ خطأ أثناء معالجة الرسالة:", err.message);
    }
});

// --- إعدادات الاتصال ---
service.on('ready', () => {
    console.log(`✅ البوت متصل باسم: ${service.currentSubscriber.nickname}`);
    console.log(`👀 نظام المراقبة نشط للعضوية: ${settings.monitorId}`);
    
    // الانضمام للروم المستهدف لضمان القدرة على الإرسال
    service.group.joinById(settings.targetRoomId)
        .then(() => console.log(`🔗 متصل بروم العمليات: ${settings.targetRoomId}`))
        .catch(() => console.log(`⚠️ فشل الانضمام للروم ${settings.targetRoomId}، تأكد من أن البوت غير محظور.`));
});

service.login(settings.identity, settings.secret);
