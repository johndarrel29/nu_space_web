import { useEffect } from 'react';

function useKeyBinding({ key, callback, dependencies = [] }) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Check if the specified key is pressed and not inside an input/textarea
            if (e.key === key && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
                // e.preventDefault();
                callback();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [key, callback, ...dependencies]);
}


export default useKeyBinding