import { useNavigate } from 'react-router-dom';
import { Button, Header } from '../components';
import { useOnlineStatus } from '../hooks';
import { useUserStoreWithAuth } from '../store';


// Simplified ErrorPage now shows a No Internet Connection visual + button.
export default function ErrorPage() {
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();
    const { isUserRSORepresentative, isUserAdmin, isCoordinator } = useUserStoreWithAuth();

    return (
        <div className="w-full min-h-screen bg-gray-100 flex flex-col">
            <div className="w-full mx-auto pt-6 px-6">
                {/* header */}
                <div className="flex justify-start">
                    <Header theme="dark" />
                </div>
            </div>

            <div className="flex-grow flex items-center justify-center px-6 pb-20">
                {/* design a 404 error page */}
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-800">404 - Not Found</h1>
                    <p className="mt-4 text-gray-600">Sorry, the page you are looking for does not exist.</p>
                    <Button onClick={() => navigate((isUserRSORepresentative || isUserAdmin || isCoordinator) ? ('/dashboard' || '/') : ('/general-documents' || '/'))} className="mt-6">Go to Home</Button>
                </div>
            </div>
        </div>
    );
}

