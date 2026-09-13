// Disabled classes for better UX and accessibility
export const disabledClasses = `
  disabled:cursor-not-allowed 
  disabled:select-none 
  disabled:pointer-events-none 
  disabled:opacity-50
  disabled:[aria-disabled="true"]
  disabled:[aria-readonly="true"]
  disabled:[tabindex="-1"]
`;

// Extended disabled classes for better UX and accessibility
export const extendedDisabledClasses = `
  disabled:cursor-not-allowed 
  disabled:select-none 
  disabled:pointer-events-none 
  disabled:opacity-50
  disabled:bg-gray-50 
  disabled:dark:bg-gray-800
  disabled:border-gray-200
  disabled:dark:border-gray-700
  disabled:text-gray-400
  disabled:dark:text-gray-500
  disabled:shadow-none
  disabled:hover:shadow-none
  disabled:focus:ring-0
  disabled:focus:outline-none
  disabled:active:transform-none
  disabled:active:scale-100
  disabled:transition-none
  disabled:placeholder-gray-400
  disabled:dark:placeholder-gray-500
  disabled:[aria-disabled="true"]
  disabled:[aria-readonly="true"]
  disabled:[tabindex="-1"]
`;
