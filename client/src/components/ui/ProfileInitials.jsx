import { getInitials } from "../../utils";

export default function ProfileInitials({ firstName, lastName, className = "h-10 w-10 text-lg" }) {

    return (
        <>
            <div className={`rounded-full bg-background flex items-center justify-center font-semibold text-lg text-primary aspect-square ${className}`}>
                {getInitials(firstName, lastName)}
            </div>
        </>
    )
}