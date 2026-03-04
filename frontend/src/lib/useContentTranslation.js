import { useState, useEffect } from 'react';
import { useLingoLocale } from 'lingo.dev/react/client';
import { translateContent } from './lingo';

export const useContentTranslation = (posts, sourceLangField = 'base_lang') => {
    const locale = useLingoLocale();
    const [translatedPosts, setTranslatedPosts] = useState([]);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translationError, setTranslationError] = useState(null);

    useEffect(() => {
        const translateAll = async () => {
            if (!posts || posts.length === 0) {
                setTranslatedPosts([]);
                return;
            }

            setIsTranslating(true);
            setTranslationError(null);

            try {
                const results = await Promise.all(
                    posts.map(async (post) => {
                        const sourceLanguage = post[sourceLangField] || 'en';
                        
                        if (sourceLanguage === locale) {
                            return post;
                        }

                        try {
                            const translatedTitle = await translateContent(
                                post.title,
                                sourceLanguage,
                                locale
                            );
                            const translatedContent = await translateContent(
                                post.content,
                                sourceLanguage,
                                locale
                            );

                            return {
                                ...post,
                                title: translatedTitle,
                                content: translatedContent
                            };
                        } catch (error) {
                            console.error(`Translation failed for post ${post.id}:`, error);
                            return post;
                        }
                    })
                );

                setTranslatedPosts(results);
            } catch (error) {
                console.error('Batch translation failed:', error);
                setTranslationError(error.message);
                setTranslatedPosts(posts);
            } finally {
                setIsTranslating(false);
            }
        };

        translateAll();
    }, [posts, locale, sourceLangField]);

    return {
        translatedPosts: translatedPosts.length > 0 ? translatedPosts : posts,
        isTranslating,
        translationError,
        locale
    };
};

export const useSingleContentTranslation = (post, sourceLangField = 'base_lang') => {
    const locale = useLingoLocale();
    const [translatedPost, setTranslatedPost] = useState(post);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translationError, setTranslationError] = useState(null);

    useEffect(() => {
        const translatePost = async () => {
            if (!post) {
                setTranslatedPost(null);
                return;
            }

            const sourceLanguage = post[sourceLangField] || 'en';
            
            if (sourceLanguage === locale) {
                setTranslatedPost(post);
                return;
            }

            setIsTranslating(true);
            setTranslationError(null);

            try {
                const translatedTitle = await translateContent(
                    post.title,
                    sourceLanguage,
                    locale
                );
                const translatedContent = await translateContent(
                    post.content,
                    sourceLanguage,
                    locale
                );

                setTranslatedPost({
                    ...post,
                    title: translatedTitle,
                    content: translatedContent
                });
            } catch (error) {
                console.error('Translation failed:', error);
                setTranslationError(error.message);
                setTranslatedPost(post);
            } finally {
                setIsTranslating(false);
            }
        };

        translatePost();
    }, [post, locale, sourceLangField]);

    return {
        translatedPost: translatedPost || post,
        isTranslating,
        translationError,
        locale
    };
};
