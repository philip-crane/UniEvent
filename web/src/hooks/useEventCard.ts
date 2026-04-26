import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// this hook (functionality) is connected to EventCard.tsx component (that handles the UI)
// specifically it manages expand/collapse stuff when click the chevron button
// chevron = arrow minus the stick (so just the arrowhead). The icon is from lucide-react,
// which is a nice free to use icon library in npm

export function useEventCard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  // () => ("arrow function") means when "called, do this". Actually its a shorthand that 
  // TS/JS has for defining functions; instead of writing "function toggleExpanded() { ... }",
  // we can write "const toggleExpanded = () => { ... }". The missing stuff is implied
  // and JS/TS understands it automatically (and will complain if it dont). Its a nice
  // piece of "syntactic sugar" (kinda like ? :).
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCardClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  return {
    isExpanded,
    toggleExpanded,
    handleCardClick,
  };
}
