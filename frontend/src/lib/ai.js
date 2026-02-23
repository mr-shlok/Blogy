import axiosInstance from './axios';

const callTranslateAPI = async (content, sourceLang, targetLang) => {
    try {
        const { data } = await axiosInstance.post('/api/translate', {
            content,
            sourceLang,
            targetLang
        });
        return data.translatedContent;
    } catch (error) {
        console.error('Translation API error:', error);
        throw new Error(error.response?.data?.message || `Translation failed: ${error.message}`);
    }
};

const callGenerateAPI = async (topic, locale) => {
    try {
        const { data } = await axiosInstance.post('/api/generate-blog', {
            topic,
            locale
        });
        return data;
    } catch (error) {
        console.error('Generation API error:', error);
        throw new Error(error.response?.data?.message || error.response?.data?.error || `Generation failed: ${error.message}`);
    }
};

export const generateAllBlogContent = async (topic, lang = 'en') => {
    if (!topic || topic.trim().length < 5) return null;
    try {
        return await callGenerateAPI(topic, lang);
    } catch (error) {
        console.error('AI Full Generation failed:', error);
        return null;
    }
};

export const generateTitle = async (content, lang = 'en') => {
    if (!content || content.trim().length < 10) {
        throw new Error('Content too short. Please write at least 10 characters.');
    }
    try {
        const result = await callGenerateAPI(content, lang);
        return result.title || '';
    } catch (error) {
        console.error('Title generation failed:', error);
        throw new Error(`Title generation failed: ${error.message}`);
    }
};

export const generateSEODescription = async (content, lang = 'en') => {
    if (!content || content.trim().length < 10) {
        throw new Error('Content too short. Please write at least 10 characters.');
    }
    try {
        const result = await callGenerateAPI(content, lang);
        return result.description || '';
    } catch (error) {
        console.error('SEO generation failed:', error);
        throw new Error(`SEO description generation failed: ${error.message}`);
    }
};

export const generateHashtags = async (content, lang = 'en') => {
    if (!content || content.trim().length < 10) {
        throw new Error('Content too short. Please write at least 10 characters.');
    }
    try {
        const result = await callGenerateAPI(content, lang);
        return (result.hashtags || []).join(' ') || '';
    } catch (error) {
        console.error('Hashtag generation failed:', error);
        throw new Error(`Hashtag generation failed: ${error.message}`);
    }
};

export const generateSummary = async (content, lang = 'en') => {
    if (!content || content.trim().length < 10) {
        throw new Error('Content too short. Please write at least 10 characters.');
    }
    try {
        const result = await callGenerateAPI(content, lang);
        return result.summary || '';
    } catch (error) {
        console.error('Summary generation failed:', error);
        throw new Error(`Summary generation failed: ${error.message}`);
    }
};

export const improveWriting = async (content, lang = 'en') => {
    if (!content || content.trim().length < 10) return content;
    try {
        const { data } = await axiosInstance.post('/api/improve-writing', {
            content,
            locale: lang
        });
        return data.improvedContent;
    } catch (error) {
        console.error('Writing improvement failed:', error);
        throw new Error(`Writing improvement failed: ${error.response?.data?.message || error.message}`);
    }
};

export const switchTone = async (content, tone, lang = 'en') => {
    if (!content || content.trim().length < 10) return content;
    try {
        const prompt = `Rewrite the following text in a ${tone} tone. Keep it in ${lang}.:\n\n${content}`;
        const { data } = await axiosInstance.post('/api/improve-writing', {
            content: prompt,
            locale: lang
        });
        return data.improvedContent;
    } catch (error) {
        console.error('Tone switch failed:', error);
        throw new Error(`Tone switch failed: ${error.response?.data?.message || error.message}`);
    }
};

export const summarizeComments = async (comments, lang = 'en') => {
    if (!comments || comments.length === 0) {
        throw new Error('No comments to summarize.');
    }
    try {
        const { data } = await axiosInstance.post('/api/summarize-comments', {
            comments,
            locale: lang
        });
        return data.summary;
    } catch (error) {
        console.error('Comment summarization failed:', error);
        throw new Error(`Comment summarization failed: ${error.response?.data?.message || error.message}`);
    }
};
