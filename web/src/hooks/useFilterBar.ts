import { useEffect, useState } from 'react'; // react funktions
import { parseDateOnly, startOfDayMs, endOfDayMs } from '../utils/dateUtils'; // function from date utils
import type { Event as EventType } from '../types'; // import event type
import type { SortMode } from '../components/FilterBar';

// custom react function to filter events
export function useFilterBar(events: EventType[]) {
  const [pageId, setPageId] = useState<string>('');

  // text search
  // debounce = wait for user to stop typing
  // () => is shorthand for making a quick new function w/ void return
  const [query, setQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>(''); // only update after user stops typing for 250ms
  useEffect(() => { // kører altid når query ændrer sig
    const id = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, 250); // timeout for 250ms delay 
    return () => clearTimeout(id); // if query changes again within 250ms, clear previous timeout and start new one
  }, [query]);

  // date range states (from / to)
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // apply filters

  //creates a variable using result of page filter and
  // if pageid is not empty then filter events by pageid else return all events
  const filteredByPage = pageId ? events.filter(e => e.pageId === pageId) : events;

  // creates a variable using result of text filter
  // for every event if haystack icludes either the title, description or place name then include it in the result
  const textFiltered = debouncedQuery
    ? filteredByPage.filter(event => {
      const haystack = (
        (event.title || '') + ' ' +
        (event.description || '') + ' ' +
        (event.place?.name || '')
      ).toLowerCase();
      return haystack.includes(debouncedQuery);
    })
    : filteredByPage;

  const fromObj = parseDateOnly(fromDate); // turn fromDate string into date object
  const toObj = parseDateOnly(toDate); // turn toDate string into date object
  const invalidRange = !!(fromObj && toObj && toObj < fromObj); // check if range is invalid
  const effectiveToObj = invalidRange ? undefined : toObj; //if invalid then ignore toDate

  // filter by date range 
  const dateFiltered = textFiltered.filter(event => { // for each event
    const eventMs = new Date(event.startTime).getTime(); // get timestamp of event start time
    if (fromObj && eventMs < startOfDayMs(fromObj)) return false; // if fromdate is after event start then exclude
    if (effectiveToObj && eventMs > endOfDayMs(effectiveToObj)) return false; // if todate is before event start then exclude
    return true;
  });



  // added: sort mode for upcoming / newest / all
  const [sortMode, setSortMode] = useState<SortMode>('upcoming'); // upcoming is default

  // pick a created/added timestamp from an event (ms)
  const getCreatedMs = (e: EventType) => { // for each event we 
    // pick the first available "created/added" timestamp field and fallback to startTime if none exist
    type LegacyEvent = EventType & { createdTime?: string; postedTime?: string; insertedAt?: string; addedAt?: string };
    const le = e as LegacyEvent;
    const maybe = le.createdTime ?? le.createdAt ?? le.postedTime ?? le.insertedAt ?? le.addedAt ?? le.startTime;
    const ms = Date.parse(maybe); // parse maybe into ms
    return isNaN(ms) ? new Date(e.startTime).getTime() : ms; // fallback to startTime if parsing fails
  };

  // create a new list with the filtered events and apply sortMode
  let list = [...dateFiltered];

  if (sortMode === 'upcoming') { // if upcoming is selected then
    list = list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()); // sort by startTime ascending
  } else if (sortMode === 'newest') { // if it is set to newest then
    list = list.sort((a, b) => getCreatedMs(b) - getCreatedMs(a)); // sort by createdMs descending (so when they were added)
  }



  return {
    pageId,
    setPageId,
    query,
    setQuery,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    sortMode,
    setSortMode,
    list,
    count: list.length,
    invalidRange,
  };
}
