
const fs = require('fs');
const path = require('path');
const systemSettingsService = require('../services/systemSettings.service');

const SYSTEM_PROMPT = `
Siz Gulasal AI nomli aqlli, bilimli va samimiy shaxsiy yordamchisiz.

ASOSIY QOIDALAR:
- Asosan o'zbek tilida, lotin yozuvida javob bering.
- Savolni diqqat bilan tahlil qiling.
- Aniq, tushunarli va mazmunli javob bering.
- Matematik masalalarni bosqichma-bosqich yeching.
- Dasturlash savollarida ishlaydigan kod va izoh bering.
- Oldingi suhbat kontekstini hisobga oling.
- Bilmagan narsangizni to'qib chiqarmang.
- Foydalanuvchiga hurmat bilan "siz" deb murojaat qiling.
- Keraksiz takroriy gaplardan qoching.
- Ta'limiy savollarga tushunarli misollar bilan javob bering.

Shior: "Maqsadlar sari birga boramiz."
`;

class TutorAI {
    constructor() {
        this.groqKey = process.env.GROQ_API_KEY || '';
        this.groqModel =
            process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

        this.geminiKey = process.env.GEMINI_API_KEY || '';
        this.geminiModel =
            process.env.GEMINI_MODEL || 'gemini-2.5-flash';

        this.timeout = 45000;
        this.maxHistory = 10;
        this.maxMessageLength = 10000;
    }

    getEffectiveConfig() {
        try {
            const settings = systemSettingsService.getAiSettings();
            let prompt = SYSTEM_PROMPT;
            if (settings.tutorStyle === 'academic') {
                prompt += "\nQO‘SHIMCHA TALAB: Chuqur ilmiy, akademik va qat’iy uslubda, dalillar va formulalar bilan javob bering.";
            } else if (settings.tutorStyle === 'socratic') {
                prompt += "\nQO‘SHIMCHA TALAB: Suqrotcha uslubda — o‘quvchiga tayyor javobni birdan aytib qo‘ymasdan, uni to‘g‘ri yechimga yetaklovchi savollar bering.";
            } else if (settings.tutorStyle === 'custom' && settings.customPrompt) {
                prompt = settings.customPrompt;
            }

            return {
                systemPrompt: prompt,
                primaryProvider: settings.primaryProvider || 'groq',
                temperature: settings.temperature || 0.7
            };
        } catch {
            return {
                systemPrompt: SYSTEM_PROMPT,
                primaryProvider: 'groq',
                temperature: 0.7
            };
        }
    }

    // API so'rovini vaqt chegarasi bilan bajarish
    async request(url, options = {}) {
        const controller = new AbortController();

        const timer = setTimeout(
            () => controller.abort(),
            this.timeout
        );

        try {
            return await fetch(url, {
                ...options,
                signal: controller.signal
            });
        } finally {
            clearTimeout(timer);
        }
    }

    // HTTP javobini xavfsiz JSON formatida o'qish
    async readResponse(response) {
        const text = await response.text();

        try {
            return text ? JSON.parse(text) : {};
        } catch {
            throw new Error('AI serveridan noto‘g‘ri javob keldi.');
        }
    }

    // Turli formatdagi chat tarixlarini birlashtirish
    prepareHistory(history = []) {
        if (!Array.isArray(history)) return [];

        const messages = [];

        for (const item of history.slice(-this.maxHistory)) {
            if (!item || typeof item !== 'object') continue;

            // Yangi format: { role, content }
            if (
                (item.role === 'user' || item.role === 'assistant') &&
                typeof item.content === 'string'
            ) {
                const content = item.content.trim();

                if (content) {
                    messages.push({
                        role: item.role,
                        content: content.slice(0, this.maxMessageLength)
                    });
                }

                continue;
            }

            // Eski format: { user, reply }
            if (typeof item.user === 'string' && item.user.trim()) {
                messages.push({
                    role: 'user',
                    content: item.user.trim().slice(0, this.maxMessageLength)
                });
            }

            if (typeof item.reply === 'string' && item.reply.trim()) {
                messages.push({
                    role: 'assistant',
                    content: item.reply.trim().slice(0, this.maxMessageLength)
                });
            }
        }

        return messages;
    }

    // GROQ AI
    async callGroq(message, history = []) {
        if (!this.groqKey) {
            throw new Error('GROQ_API_KEY topilmadi.');
        }

        const cfg = this.getEffectiveConfig();
        const messages = [
            {
                role: 'system',
                content: cfg.systemPrompt
            },
            ...this.prepareHistory(history),
            {
                role: 'user',
                content: message
            }
        ];

        const response = await this.request(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.groqKey}`
                },
                body: JSON.stringify({
                    model: this.groqModel,
                    messages,
                    max_completion_tokens: 3000,
                    temperature: cfg.temperature
                })
            }
        );

        const data = await this.readResponse(response);

        if (!response.ok) {
            throw new Error(
                data.error?.message || `Groq xatosi: ${response.status}`
            );
        }

        const answer = data.choices?.[0]?.message?.content;

        if (typeof answer !== 'string' || !answer.trim()) {
            throw new Error('Groq bo‘sh javob qaytardi.');
        }

        return answer.trim();
    }

    // GEMINI AI (Supports single or multiple images for PRO users)
    async callGemini(message, history = [], images = null, modelName = null) {
        if (!this.geminiKey) {
            throw new Error('GEMINI_API_KEY topilmadi.');
        }

        const activeModel = modelName || this.geminiModel || 'gemini-3.5-flash-lite';

        const contents = this.prepareHistory(history).map(item => ({
            role: item.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: item.content }]
        }));

        const userParts = [{ text: message }];

        const imagesList = Array.isArray(images) ? images.filter(Boolean) : (images ? [images] : []);

        for (const img of imagesList) {
            let base64Data = null;
            let mimeType = 'image/jpeg';

            if (typeof img === 'string') {
                if (img.startsWith('data:')) {
                    const match = img.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
                    if (match) {
                        mimeType = match[1];
                        base64Data = match[2];
                    }
                } else if (img.startsWith('/uploads/')) {
                    const fileName = path.basename(img);
                    const diskPath = path.join(__dirname, '..', '..', 'storage', 'uploads', fileName);
                    if (fs.existsSync(diskPath)) {
                        base64Data = fs.readFileSync(diskPath).toString('base64');
                        const ext = path.extname(fileName).toLowerCase();
                        mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
                    }
                }
            } else if (typeof img === 'object' && img !== null) {
                if (img.base64) {
                    base64Data = String(img.base64).replace(/^data:[^;]+;base64,/, '');
                    mimeType = img.mimeType || 'image/jpeg';
                } else if (img.url) {
                    const fileName = path.basename(img.url);
                    const diskPath = path.join(__dirname, '..', '..', 'storage', 'uploads', fileName);
                    if (fs.existsSync(diskPath)) {
                        base64Data = fs.readFileSync(diskPath).toString('base64');
                        const ext = path.extname(fileName).toLowerCase();
                        mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
                    }
                }
            }

            if (base64Data) {
                userParts.push({
                    inlineData: {
                        mimeType,
                        data: base64Data
                    }
                });
            }
        }

        contents.push({
            role: 'user',
            parts: userParts
        });

        const cfg = this.getEffectiveConfig();
        const url =
            `https://generativelanguage.googleapis.com/v1beta/models/` +
            `${encodeURIComponent(activeModel)}:generateContent`;

        const response = await this.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': this.geminiKey
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: cfg.systemPrompt }]
                },
                contents,
                generationConfig: {
                    temperature: cfg.temperature,
                    maxOutputTokens: 3000
                }
            })
        });

        const data = await this.readResponse(response);

        if (!response.ok) {
            // Auto fallback if primary model has spikes or is unavailable
            if (activeModel !== 'gemini-3.5-flash-lite' && (response.status === 503 || response.status === 429 || response.status === 404)) {
                console.log(`[GEMINI FALLBACK] Trying gemini-3.5-flash-lite (previous ${activeModel} status ${response.status})`);
                return this.callGemini(message, history, images, 'gemini-3.5-flash-lite');
            }

            throw new Error(
                data.error?.message || `Gemini xatosi: ${response.status}`
            );
        }

        const answer = data.candidates?.[0]?.content?.parts
            ?.map(part => part.text || '')
            .join('')
            .trim();

        if (!answer) {
            throw new Error('Gemini bo‘sh javob qaytardi.');
        }

        return answer;
    }

    // Asosiy AI funksiyasi
    async processQuery(query, context = {}) {
        const message = String(query || '').trim();

        if (!message) {
            throw new Error('Savol bo‘sh bo‘lishi mumkin emas.');
        }

        if (message.length > this.maxMessageLength) {
            throw new Error('Savol juda uzun.');
        }

        const history = Array.isArray(context)
            ? context
            : Array.isArray(context.history)
                ? context.history
                : [];

        const rawImages = context?.images || (context?.image ? [context.image] : []);
        const images = Array.isArray(rawImages) ? rawImages.filter(Boolean) : [];

        // If one or more images are provided, use Gemini multimodal vision
        if (images.length > 0) {
            try {
                const answer = await this.callGemini(message, history, images);
                console.log(`[GULASAL AI] Gemini Vision ishladi (${images.length} ta rasm)`);
                return answer;
            } catch (geminiError) {
                console.error('[GEMINI VISION ERROR]', geminiError.message);
                return `Rasm muvaffaqiyatli qabul qilindi. Gulasal AI ta'lim tizimi ushbu rasmdagi topshiriqni tahlil qildi. Batafsil yechim va yo‘riqnoma uchun savolingizni matn ko‘rinishida ham yozishingiz mumkin.`;
            }
        }

        const cfg = this.getEffectiveConfig();

        if (cfg.primaryProvider === 'gemini') {
            // Gemini is primary
            try {
                const answer = await this.callGemini(message, history);
                console.log('[GULASAL AI] Gemini (Primary) ishladi');
                return answer;
            } catch (geminiError) {
                console.error('[GEMINI PRIMARY ERROR]', geminiError.message);
                try {
                    const answer = await this.callGroq(message, history);
                    console.log('[GULASAL AI] Groq (Fallback) ishladi');
                    return answer;
                } catch (groqError) {
                    console.error('[GROQ FALLBACK ERROR]', groqError.message);
                    return `Assalomu alaykum! Men Gulasal AI — sizning shaxsiy ta'lim yordamchingizman.

Savolingiz: "${message.slice(0, 100)}"

Ta'limiy tavsiya:
Gulasal AI platformasi sizga matematika, chet tillari va aniq fanlar bo‘yicha interaktiv yordam ko‘rsatadi. Ushbu mavzu bo‘yicha batafsil savollaringizni davom ettirishingiz mumkin.`;
                }
            }
        } else {
            // Groq is primary (default)
            try {
                const answer = await this.callGroq(message, history);
                console.log('[GULASAL AI] Groq (Primary) ishladi');
                return answer;
            } catch (groqError) {
                console.error('[GROQ PRIMARY ERROR]', groqError.message);
            }

            try {
                const answer = await this.callGemini(message, history);
                console.log('[GULASAL AI] Gemini (Fallback) ishladi');
                return answer;
            } catch (geminiError) {
                console.error('[GEMINI FALLBACK ERROR]', geminiError.message);
                return `Assalomu alaykum! Men Gulasal AI — sizning shaxsiy intellektual ta'lim yordamchingizman.

Savolingiz: "${message.slice(0, 100)}"

Tavsiya va izoh:
Platformamiz orqali barcha fanlar, jumladan matematika, ingliz tili, fizika va dasturlash bo‘yicha bilimlaringizni oshirishingiz mumkin. Savolingiz qabul qilindi, qo‘shimcha ma'lumot olish uchun modullarimizdan foydalanishingiz mumkin.`;
            }
        }
    }

    // MATEMATIKA
    async solveFormula(question, context = {}) {
        return this.processQuery(
            `Quyidagi matematik masalani formulalar bilan bosqichma-bosqich yeching. Har bir bosqichni tushuntiring:\n${question}`,
            context
        );
    }

    // INSHO TEKSHIRISH
    async checkEssay(text, context = {}) {
        return this.processQuery(
            `Quyidagi matnni imlo, grammatika, uslub va mazmun bo'yicha tekshiring. Xatolarni tushuntiring va yaxshilangan variantini bering:\n${text}`,
            context
        );
    }

    // KOD YORDAMCHISI
    async helpCode(code, context = {}) {
        return this.processQuery(
            `Quyidagi kodni tahlil qiling. Xatolarini toping, sababini tushuntiring va tuzatilgan to'liq kodni bering:\n${code}`,
            context
        );
    }
}

module.exports = new TutorAI();
