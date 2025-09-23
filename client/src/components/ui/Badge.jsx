import React from 'react';

function Badge({ style, text }) {
  const [handleStyle, setHandleStyle] = React.useState("bg-blue-100 text-blue-800")
  React.useEffect(() => {
    switch (style) {
      case "primary":
        // Golden Yellow: Associated with energy, optimism, and draws attention.
        setHandleStyle("bg-yellow-100 text-black text-xs font-medium me-2 px-2.5 py-0.5 rounded-full dark:bg-gray-700 dark:text-yellow-300");
        break;
      case "secondary":
        // Royal Blue: Trust, stability, and professionalism.
        setHandleStyle("bg-blue-100 text-blue-800");
        break;
      case "tertiary":
        // Emerald Green: Growth, harmony, and subtle positivity.
        setHandleStyle("bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-gray-700 dark:text-green-400");
        break;
      case "quarternary":
        // Warm Gray: Neutral, soft contrast for least priority.
        setHandleStyle("bg-gray-200 text-black-700");
        break;
      case "error":
        // Red: Urgent, attention-grabbing for errors or critical issues.
        setHandleStyle("bg-red-100 text-black text-xs font-medium me-2 px-2.5 py-0.5 rounded-full dark:bg-gray-700 dark:text-red-400");
        break;
      case "success":
        // Light Green: Positive, success, or completion.
        setHandleStyle("bg-green-100 text-black text-xs font-medium me-2 px-2.5 py-0.5 rounded-full dark:bg-gray-700 dark:text-green-400");
        break;
      default:
        // Fallback to a calm neutral tone.
        setHandleStyle("bg-slate-400/10 text-slate-700");
    }

  }, [style])

  return (
    <>

      <div className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full color-off-black ${handleStyle}`}>
        {text}
      </div>
    </>

  )
}

export default Badge;