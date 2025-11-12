import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const MainLayout = () => {
    return (
        <div className="flex h-screen flex-col">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto bg-muted/10 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
