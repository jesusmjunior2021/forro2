import { useState, useCallback } from 'react';
import { GoogleDriveFile } from '../types';
import { mockDriveFiles } from '../data/mockDriveFiles';

export const useGoogleDrive = () => {
    const [isSignedIn, setIsSignedIn] = useState(true); // Always signed in for mock data
    const [error, setError] = useState<string | null>(null);

    /**
     * Inicia o fluxo de autenticação (simulado).
     */
    const handleAuthClick = useCallback(() => {
        setIsSignedIn(true);
        setError(null);
    }, []);

    /**
     * Desconecta o usuário (simulado).
     */
    const handleSignOutClick = useCallback(() => {
        setIsSignedIn(false);
    }, []);

    /**
     * Busca arquivos na lista estática de arquivos.
     */
    const searchFiles = useCallback(async (searchQuery: string): Promise<GoogleDriveFile[]> => {
        if (!isSignedIn) {
            // This case might not be reachable if always signed in, but good for completeness
            throw new Error("Usuário não está autenticado no Google Drive (simulado).");
        }
        try {
            const lowerCaseQuery = searchQuery.toLowerCase();
            const results = mockDriveFiles.filter(file => 
                file.name.toLowerCase().includes(lowerCaseQuery)
            );
            // Simulate async API call
            return Promise.resolve(results);
        } catch (err: any) {
            console.error("Erro ao buscar arquivos no Drive (simulado)", err);
            setError(`Erro ao buscar no Drive (simulado): ${err.message}`);
            throw new Error(`Erro ao buscar no Drive (simulado): ${err.message}`);
        }
    }, [isSignedIn]);

    return {
        isInitialized: true, // Always initialized
        isSignedIn,
        error,
        handleAuthClick,
        handleSignOutClick,
        searchFiles
    };
};
