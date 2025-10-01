import { Tooltip } from "react-tooltip";


export default function GlobalTooltip() {
    return (
        <Tooltip
            id="global-tooltip"
            className="bg-gray-600 text-white text-xs p-2 rounded shadow-sm opacity-50 z-[99999]"
        />
    );
}