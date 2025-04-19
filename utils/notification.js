// export const getNotificationTrigger = (date) => {
//     const now = Date.now();
//     const timestamp = date.getTime();
  
//     if (timestamp <= now + 60_000) { // déclenchement dans <1 min = pas bon
//       const fallback = new Date(now + 5 * 60_000);
//       return { type: 'date', timestamp: fallback.getTime() };
//     }
  
//     return {
//       type: 'date',
//       timestamp,
//     };
//   };

export const getNotificationTrigger = (date) => {
    const localTimestamp = date.getTime();
    const now = Date.now();
  
    // Ajoute une marge de 1 minute
    if (localTimestamp <= now + 60_000) {
      const fallback = new Date(now + 5 * 60_000);
      return {
        type: 'date',
        timestamp: fallback.getTime(),
      };
    }
  
    return {
      type: 'date',
      timestamp: localTimestamp,
    };
  };  