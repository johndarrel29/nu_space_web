

// function TextInput({ type = 'text', placeholder, value, onChange, className }) {
//   return (
//     <input 
//         type={type} 
//         placeholder={placeholder} 
//         value={value} 
//         onChange={onChange} 
//         className={className || "bg-textfield border border-mid-gray text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"}
//     />
// );
//   }

//   export default TextInput;

// In your components folder
const TextInput = ({ id, name, type, placeholder, value, onChange, className, disabled, ...props }) => {
  return (
    <input
      id={id}
      disabled={disabled}
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={className || "bg-textfield border border-mid-gray text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"}
      {...props}
    />
  );
};

export default TextInput;
