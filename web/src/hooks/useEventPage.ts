import { useEffect, useRef, useState } from 'react';
import { getEventById, getPages } from '../services/dal';
import { signOutCurrentUser } from '../handlers/logout';
import { mapAuthError } from '../utils/authUtils';
import { getOrganizerName, getEventCoverImageUrl } from '../utils/eventUtils';
import { useClickOutside } from './useClickOutside';
import { useAuth } from '../context/AuthContext';
import { SAVE_FEEDBACK_MS } from '../constants';
import type { Event, Page } from '../types';

export function useEventPage(id: string | undefined) {
    const { currentUser } = useAuth();
    const [event, setEvent] = useState<Event | null>(null);
    const [pages, setPages] = useState<Page[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [saveFeedback, setSaveFeedback] = useState('');
    const addMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [fetchedEvent, fetchedPages] = await Promise.all([
                    getEventById(id),
                    getPages().catch(() => []),
                ]);
                setEvent(fetchedEvent);
                setPages(fetchedPages);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    useClickOutside(addMenuRef, showAddMenu, () => setShowAddMenu(false));

    const handleLikeToggle = (isSaved: boolean) => {
        setSaveFeedback(isSaved ? 'Saved to your profile.' : 'Removed from saved events.');
        window.setTimeout(() => setSaveFeedback(''), SAVE_FEEDBACK_MS);
    };

    async function handleSignOut() {
        try {
            setIsSigningOut(true);
            await signOutCurrentUser();
        } catch (error) {
            console.error(mapAuthError(error));
        } finally {
            setIsSigningOut(false);
        }
    }

    return {
        currentUser,
        event,
        isLoading,
        isSigningOut,
        showAddMenu,
        setShowAddMenu,
        saveFeedback,
        addMenuRef,
        handleLikeToggle,
        handleSignOut,
        userLabel: currentUser?.displayName || currentUser?.email || 'My Profile',
        organizerName: getOrganizerName(event, pages),
        coverImageUrl: getEventCoverImageUrl(event?.coverImageUrl),
    };
}
