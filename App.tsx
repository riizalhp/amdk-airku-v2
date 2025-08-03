import React from 'react';
import { Role } from './types';
import { AdminView } from './components/admin/AdminView';
import { SalesView } from './components/sales/SalesView';
import { DriverView } from './components/driver/DriverView';
import { LoginView } from './components/LoginView';
import { useAppContext } from './hooks/useAppContext';


const App: React.FC = () => {
    const { currentUser } = useAppContext();

    if (!currentUser) {
        return <LoginView />;
    }

    switch (currentUser.role) {
        case Role.ADMIN:
            return <AdminView />;
        case Role.SALES:
            return <SalesView />;
        case Role.DRIVER:
            return <DriverView />;
        default:
            return <LoginView />;
    }
};

export default App;