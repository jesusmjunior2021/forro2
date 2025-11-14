import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
    ConnectionState, Transcription, AssistantSettings, ChatSession, 
    InteractionMode, TTSState, RecordingState, ResourceLink, 
    LiveDocument, PersistenceMode, Video, LocalContextLink, 
    InformationCard, DeepAnalysisState, GroundedSearchState,
    ProjectAssistantState, PostItNote, CalendarEvent, Reminder,
    MagazineResource,
    ArchivedLink,
    ReportContent,
    ImageGenerationState,
    ImageGeneration,
    SpotifyState,
    SerpApiState,
    SerpMagazineResult,
    SerpCardResult,
    SlateCard,
    Cell,
    SpreadsheetCommand,
    SpreadsheetVersion,
    Anomaly,
    PollinationImage,
    CeilingType,
    Product
} from '../types';
import { usePersistence } from './usePersistence';
import { useLiveConversation } from './useLiveConversation';
import { useAudioService } from './useAudioService';
// Fix: Import `useRssReader` to manage RSS feed data.
import { useRssReader } from './useRssReader';
import { cleanTextForTTS, getThumbnailUrl } from '../utils/resourceUtils';
import { useGoogleDrive } from './useGoogleDrive';
import { GoogleGenAI, GenerateContentResponse, Chat, FunctionDeclaration, Type } from '@google/genai';
import { useTextToSpeech } from './useTextToSpeech';
import { blobToBase64 } from '../utils/fileUtils';
import { calculateCeilingMaterials } from '../utils/calculationUtils';

const CORS_PROXY_URL = 'https://corsproxy.io/?';

const sanitizeJsonResponse = (responseText: string): string => {
    const trimmedText = responseText.trim();
    const match = trimmedText.match(/^```(?:json)?\s*([\sS]*?)\s*```$/);
    if (match && match[1]) {
        return match[1].trim();
    }
    return trimmedText;
};

const productCatalogData: Product[] = [
    { Codigo: 62, Nome: '6MM FORRO PVC 6MM', ValorPrecoFixado: 15.5, PrecoCusto: 13, EstoqueUnidade: 'UN' },
    { Codigo: 49, Nome: 'ARAME GALV PLAST 2.00 VERD (18 1KG)ST KG', ValorPrecoFixado: 28, PrecoCusto: 20, EstoqueUnidade: 'UN' },
    { Codigo: 123, Nome: 'ARREMATE F TABACO', ValorPrecoFixado: 38, PrecoCusto: 22, EstoqueUnidade: 'UN' },
    { Codigo: 8, Nome: 'ARREMATE GESSO 6MT IMBUIA', ValorPrecoFixado: 45, PrecoCusto: 26, EstoqueUnidade: 'UN' },
    { Codigo: 94, Nome: 'ARREMATE H CEREJEIRA', ValorPrecoFixado: 40, PrecoCusto: 26, EstoqueUnidade: 'UN' },
    { Codigo: 113, Nome: 'ARREMATE H IMBUIA', ValorPrecoFixado: 40, PrecoCusto: 32, EstoqueUnidade: 'UN' },
    { Codigo: 115, Nome: 'ARREMATE H MOGNO', ValorPrecoFixado: 40, PrecoCusto: 32, EstoqueUnidade: 'UN' },
    { Codigo: 99, Nome: 'ARREMATE H TABACO', ValorPrecoFixado: 40, PrecoCusto: 25, EstoqueUnidade: 'UN' },
    { Codigo: 114, Nome: 'ARREMATE MOGNO F', ValorPrecoFixado: 36, PrecoCusto: 22, EstoqueUnidade: 'UN' },
    { Codigo: 10, Nome: 'ARREMATE MOLDURA GESSO 6MT ARMANY', ValorPrecoFixado: 45, PrecoCusto: 26, EstoqueUnidade: 'UN' },
    { Codigo: 83, Nome: 'ARREMATE MOLDURA GESSO 6MT PRETO', ValorPrecoFixado: 45, PrecoCusto: 25, EstoqueUnidade: 'UN' },
    { Codigo: 98, Nome: 'ARREMATE MOLDURA GESSO 7MT CINZA', ValorPrecoFixado: 45, PrecoCusto: 30, EstoqueUnidade: 'UN' },
    { Codigo: 96, Nome: 'ARREMATE MOLDURA GESSO CHAMPANHE 6MT', ValorPrecoFixado: 45, PrecoCusto: 30, EstoqueUnidade: 'UN' },
    { Codigo: 39, Nome: 'ARREMATE PVC H 6MT', ValorPrecoFixado: 30, PrecoCusto: 18, EstoqueUnidade: 'UN' },
    { Codigo: 34, Nome: 'ARREMATE PVC MOLDURA 6M STILI', ValorPrecoFixado: 25, PrecoCusto: 16, EstoqueUnidade: 'UN' },
    { Codigo: 35, Nome: 'ARREMATE PVC MOLDURA 7MT ECO PLAST STILLI', ValorPrecoFixado: 28, PrecoCusto: 23, EstoqueUnidade: 'UN' },
    { Codigo: 36, Nome: 'ARREMATE PVC MOLDURA GESSO 6MT', ValorPrecoFixado: 30, PrecoCusto: 19, EstoqueUnidade: 'UN' },
    { Codigo: 37, Nome: 'ARREMATE PVC MOLDURA GESSO 7 ECO PLAST', ValorPrecoFixado: 30, PrecoCusto: 18, EstoqueUnidade: 'UN' },
    { Codigo: 38, Nome: 'ARREMATE PVC U 6MT', ValorPrecoFixado: 20, PrecoCusto: 12, EstoqueUnidade: 'UN' },
    { Codigo: 9, Nome: 'ARREMATE STILY 6MT ARMAMY', ValorPrecoFixado: 40, PrecoCusto: 21, EstoqueUnidade: 'UN' },
    { Codigo: 7, Nome: 'ARREMATE STILY 6MT IMBUIA', ValorPrecoFixado: 40, PrecoCusto: 21, EstoqueUnidade: 'UN' },
    { Codigo: 82, Nome: 'ARREMATE STILY 6MT PRETO', ValorPrecoFixado: 45, PrecoCusto: 25, EstoqueUnidade: 'UN' },
    { Codigo: 76, Nome: 'ARREMATE STILY CEREJEIRA 6MT', ValorPrecoFixado: 38, PrecoCusto: 22, EstoqueUnidade: 'UN' },
    { Codigo: 68, Nome: 'ARREMATE STILY TABACO 6MT', ValorPrecoFixado: 38, PrecoCusto: 22, EstoqueUnidade: 'UN' },
    { Codigo: 75, Nome: 'ARREMATE TIPO F', ValorPrecoFixado: 24, PrecoCusto: 12, EstoqueUnidade: 'UN' },
    { Codigo: 92, Nome: 'ARREMATE TIPO GESSO 8MT', ValorPrecoFixado: 30, PrecoCusto: 22, EstoqueUnidade: 'UN' },
    { Codigo: 61, Nome: 'ARREMATE TIPO GESSO CEREJEIRA 6MT', ValorPrecoFixado: 40, PrecoCusto: 32, EstoqueUnidade: 'UN' },
    { Codigo: 71, Nome: 'ARREMATE TIPO GESSO TABACO 6MT', ValorPrecoFixado: 45, PrecoCusto: 26, EstoqueUnidade: 'UN' },
    { Codigo: 85, Nome: 'ARREMATE U CEREJEIRA 6MT', ValorPrecoFixado: 36, PrecoCusto: 20, EstoqueUnidade: 'UN' },
    { Codigo: 125, Nome: 'ARREMATE U IMBUIA', ValorPrecoFixado: 38, PrecoCusto: 22, EstoqueUnidade: 'UN' },
    { Codigo: 86, Nome: 'ARREMATE U TABACO 6MT', ValorPrecoFixado: 36, PrecoCusto: 20, EstoqueUnidade: 'UN' },
    { Codigo: 74, Nome: 'BROCA ACO RAP 0.40MM.5/32', ValorPrecoFixado: 8, PrecoCusto: 4, EstoqueUnidade: 'UN' },
    { Codigo: 43, Nome: 'BROCA ACO RAP E 1/8 3MM', ValorPrecoFixado: 6, PrecoCusto: 3, EstoqueUnidade: 'UN' },
    { Codigo: 42, Nome: 'BROCA CONCR VIDIA 6MM IRWIN', ValorPrecoFixado: 10, PrecoCusto: 7, EstoqueUnidade: 'UN' },
    { Codigo: 110, Nome: 'BROCA MATERLETE 6MM', ValorPrecoFixado: 15, PrecoCusto: 10, EstoqueUnidade: 'UN' },
    { Codigo: 54, Nome: 'BUCHA C/ANEL UNID', ValorPrecoFixado: 0.05, PrecoCusto: 0.02, EstoqueUnidade: 'UN' },
    { Codigo: 28, Nome: 'CALHA 300MM ACO INOX 304 P/ VIDRO 10MM POLID', ValorPrecoFixado: 110, PrecoCusto: 81, EstoqueUnidade: 'UN' },
    { Codigo: 22, Nome: 'CANOPLA ACAB. 1.1/2 X75X0,8MM ACO INOX 304 POLIDO', ValorPrecoFixado: 14.5, PrecoCusto: 12.35, EstoqueUnidade: 'UN' },
    { Codigo: 27, Nome: 'CANOPLA ACAB. 1.1/4 X75X0,8MM ACO INOX 304 POLIDO', ValorPrecoFixado: 13.25, PrecoCusto: 10.25, EstoqueUnidade: 'UN' },
    { Codigo: 26, Nome: 'CANOPLA ACAB. 2\'\'X100X0,8MM ACO INOX 304 POLIDO', ValorPrecoFixado: 17, PrecoCusto: 13, EstoqueUnidade: 'UN' },
    { Codigo: 20, Nome: 'CANTO EXTERNO ER BRANCO 29', ValorPrecoFixado: 8, PrecoCusto: 3, EstoqueUnidade: 'UN' },
    { Codigo: 19, Nome: 'CANTO INT ER BRANCO 29', ValorPrecoFixado: 8, PrecoCusto: 3, EstoqueUnidade: 'UN' },
    { Codigo: 120, Nome: 'CANTONEIRA CEREJEIRA 3MT', ValorPrecoFixado: 40, PrecoCusto: 30, EstoqueUnidade: 'UN' },
    { Codigo: 121, Nome: 'CANTONEIRA IMBUIA', ValorPrecoFixado: 40, PrecoCusto: 30, EstoqueUnidade: 'UN' },
    { Codigo: 119, Nome: 'CANTONEIRA PRETA 3MT', ValorPrecoFixado: 40, PrecoCusto: 30, EstoqueUnidade: 'UN' },
    { Codigo: 106, Nome: 'CASE AO6', ValorPrecoFixado: 0, PrecoCusto: 25, EstoqueUnidade: 'UN' },
    { Codigo: 108, Nome: 'CASE AO6', ValorPrecoFixado: 30, PrecoCusto: 20, EstoqueUnidade: 'UN' },
    { Codigo: 73, Nome: 'DISCO FLAP 4.1/2 GRAO 120', ValorPrecoFixado: 13, PrecoCusto: 11, EstoqueUnidade: 'UN' },
    { Codigo: 84, Nome: 'DISCO FLAP GRAO 80', ValorPrecoFixado: 14, PrecoCusto: 11, EstoqueUnidade: 'UN' },
    { Codigo: 81, Nome: 'DISCO TRANSISAL ALGODAO NATURAL 20CM', ValorPrecoFixado: 45, PrecoCusto: 34, EstoqueUnidade: 'UN' },
    { Codigo: 48, Nome: 'ESCADA 4 DEGRAUS', ValorPrecoFixado: 200, PrecoCusto: 130, EstoqueUnidade: 'UN' },
    { Codigo: 50, Nome: 'ESCADA 6 DEGRAUS', ValorPrecoFixado: 250, PrecoCusto: 150, EstoqueUnidade: 'UN' },
    { Codigo: 51, Nome: 'ESCADA 7 DEGRAUS', ValorPrecoFixado: 300, PrecoCusto: 190, EstoqueUnidade: 'UN' },
    { Codigo: 52, Nome: 'ESCADA 8 DEGRAUS', ValorPrecoFixado: 330, PrecoCusto: 200, EstoqueUnidade: 'UN' },
    { Codigo: 17, Nome: 'FLANGE 1.1/2\'\'X75x2,5mm ACO INOX 304 POLIDO', ValorPrecoFixado: 14.5, PrecoCusto: 11, EstoqueUnidade: 'UN' },
    { Codigo: 18, Nome: 'FLANGE 1.1/4\'\'X75x2,5mm ACO INOX 304 LAMINADO', ValorPrecoFixado: 14.5, PrecoCusto: 10.5, EstoqueUnidade: 'UN' },
    { Codigo: 16, Nome: 'FLANGE 2\'\'X100x2,5mm ACO INOX 304 LAMINADO', ValorPrecoFixado: 16, PrecoCusto: 12, EstoqueUnidade: 'UN' },
    { Codigo: 70, Nome: 'FLANGE 40x40 2,5mm laminado', ValorPrecoFixado: 10, PrecoCusto: 7, EstoqueUnidade: 'UN' },
    { Codigo: 79, Nome: 'FORRO CANELADO CEREJEIRA 20cm', ValorPrecoFixado: 40, PrecoCusto: 35, EstoqueUnidade: 'UN' },
    { Codigo: 21, Nome: 'FORRO PVC 12 -MT', ValorPrecoFixado: 20, PrecoCusto: 16.5, EstoqueUnidade: 'UN' },
    { Codigo: 105, Nome: 'FORRO PVC 200X8MM BRC NEVE', ValorPrecoFixado: 20, PrecoCusto: 14.5, EstoqueUnidade: 'UN' },
    { Codigo: 1, Nome: 'FORRO PVC 25CM ARMANY', ValorPrecoFixado: 45, PrecoCusto: 31, EstoqueUnidade: 'UN' },
    { Codigo: 11, Nome: 'FORRO PVC 25CM IMBUIA', ValorPrecoFixado: 45, PrecoCusto: 31, EstoqueUnidade: 'UN' },
    { Codigo: 14, Nome: 'FORRO PVC CANELADO 12MT', ValorPrecoFixado: 20, PrecoCusto: 18, EstoqueUnidade: 'UN' },
    { Codigo: 66, Nome: 'FORRO PVC CEREJEIRA 25CM', ValorPrecoFixado: 45, PrecoCusto: 32, EstoqueUnidade: 'UN' },
    { Codigo: 95, Nome: 'FORRO PVC CHAMPANHE 25CM', ValorPrecoFixado: 45, PrecoCusto: 30, EstoqueUnidade: 'UN' },
    { Codigo: 97, Nome: 'FORRO PVC CINZA 25CM', ValorPrecoFixado: 45, PrecoCusto: 30, EstoqueUnidade: 'UN' },
    { Codigo: 116, Nome: 'FORRO PVC COMPLETO COM MAO DE OBRA', ValorPrecoFixado: 50, PrecoCusto: 50, EstoqueUnidade: 'UN' },
    { Codigo: 59, Nome: 'FORRO PVC LISO 20cm', ValorPrecoFixado: 20, PrecoCusto: 16, EstoqueUnidade: 'UN' },
    { Codigo: 15, Nome: 'FORRO PVC LISO 25CM', ValorPrecoFixado: 25, PrecoCusto: 19, EstoqueUnidade: 'UN' },
    { Codigo: 100, Nome: 'FORRO PVC MOGNO', ValorPrecoFixado: 45, PrecoCusto: 30, EstoqueUnidade: 'UN' },
    { Codigo: 33, Nome: 'FORRO PVC PRETO 20CM', ValorPrecoFixado: 45, PrecoCusto: 30, EstoqueUnidade: 'UN' },
    { Codigo: 67, Nome: 'FORRO PVC TABACO', ValorPrecoFixado: 45, PrecoCusto: 30, EstoqueUnidade: 'UN' },
    { Codigo: 129, Nome: 'FRETE', Categoria: undefined, Marca: undefined, ValorPrecoFixado: 100, PrecoCusto: 50, EstoqueUnidade: undefined },
    { Codigo: 25, Nome: 'GANCHEIRA 3/8 ACO INOX 304 POLIDA', ValorPrecoFixado: 21.5, PrecoCusto: 19, EstoqueUnidade: 'UN' },
    { Codigo: 23, Nome: 'LAMPARINA 1.1/2\'\' POLIDA ACO INOX (SUPORTE ENC)', ValorPrecoFixado: 13.5, PrecoCusto: 9, EstoqueUnidade: 'UN' },
    { Codigo: 24, Nome: 'LAMPARINA 2\'\' POLIDA ACO INOX (SUPORTE ENC)', ValorPrecoFixado: 14.5, PrecoCusto: 9, EstoqueUnidade: 'UN' },
    { Codigo: 90, Nome: 'MASSA DE POLIR ABRASIVO K-217 BRANCA', ValorPrecoFixado: 38, PrecoCusto: 24, EstoqueUnidade: 'UN' },
    { Codigo: 89, Nome: 'MASSA DE POLIR ABRASIVO WK-61 AZUL', ValorPrecoFixado: 28, PrecoCusto: 16, EstoqueUnidade: 'UN' },
    { Codigo: 31, Nome: 'MOEDA TAMPAO 1.1/2 X2,5MM ACO INOX 304 LAMINADO', ValorPrecoFixado: 5, PrecoCusto: 4.58, EstoqueUnidade: 'UN' },
    { Codigo: 32, Nome: 'MOEDA TAMPAO 2\'\' X2,5MM ACO INOX 304 LAMINADO', ValorPrecoFixado: 7, PrecoCusto: 6, EstoqueUnidade: 'UN' },
    { Codigo: 44, Nome: 'PA CHIP CHATA 4,0X35 BC WAVES (PAREDE) UNID', ValorPrecoFixado: 0.15, PrecoCusto: 0.05, EstoqueUnidade: 'UN' },
    { Codigo: 45, Nome: 'PA DRAYWALL PONTA AGULHA 3,5X25 OX (FORRO)', ValorPrecoFixado: 0.1, PrecoCusto: 0.05, EstoqueUnidade: 'UN' },
    { Codigo: 118, Nome: 'PAINEL IMBUIA 2,90X0,18', ValorPrecoFixado: 100, PrecoCusto: 40, EstoqueUnidade: 'UN' },
    { Codigo: 117, Nome: 'PAINEL RIPADO 2,90X0,18 CEREJEIRA', ValorPrecoFixado: 100, PrecoCusto: 38, EstoqueUnidade: 'UN' },
    { Codigo: 122, Nome: 'PAINEL RIPADO 2,90X0,18 PRETO', ValorPrecoFixado: 100, PrecoCusto: 40, EstoqueUnidade: 'UN' },
    { Codigo: 40, Nome: 'PERFIL T DE ACO', ValorPrecoFixado: 20, PrecoCusto: 11, EstoqueUnidade: 'UN' },
    { Codigo: 56, Nome: 'PORTA SANF PVC 80CM BGE', ValorPrecoFixado: 100, PrecoCusto: 70, EstoqueUnidade: 'UN' },
    { Codigo: 47, Nome: 'PORTA SANF PVC 80CM braca', ValorPrecoFixado: 110, PrecoCusto: 55, EstoqueUnidade: 'UN' },
    { Codigo: 55, Nome: 'PORTA SANF. PVC 60CM BCA', ValorPrecoFixado: 100, PrecoCusto: 70, EstoqueUnidade: 'UN' },
    { Codigo: 93, Nome: 'PORTA SANF. PVC 70 CM BCA', ValorPrecoFixado: 100, PrecoCusto: 70, EstoqueUnidade: 'UN' },
    { Codigo: 58, Nome: 'PORTAL DE PORTA', ValorPrecoFixado: 100, PrecoCusto: 70, EstoqueUnidade: 'UN' },
    { Codigo: 41, Nome: 'PREGO 15X18 1.1/2X13 KG GERDAU', ValorPrecoFixado: 20, PrecoCusto: 13, EstoqueUnidade: 'UN' },
    { Codigo: 126, Nome: 'PVC AMADEIRADO MALBEC 6MT', ValorPrecoFixado: 60, PrecoCusto: 40, EstoqueUnidade: 'UN' },
    { Codigo: 30, Nome: 'RODA ALOGODAO COSTURADA 15CM', ValorPrecoFixado: 28, PrecoCusto: 26, EstoqueUnidade: 'UN' },
    { Codigo: 60, Nome: 'RODA ALOGODAO COSTURADA 20CM', ValorPrecoFixado: 38, PrecoCusto: 35, EstoqueUnidade: 'UN' },
    { Codigo: 127, Nome: 'RODA FORRO 6MT MALBEC', ValorPrecoFixado: 50, PrecoCusto: 25, EstoqueUnidade: 'UN' },
    { Codigo: 65, Nome: 'RODA JEANS CONSTURADA 15CM', ValorPrecoFixado: 27, PrecoCusto: 24, EstoqueUnidade: 'UN' },
    { Codigo: 29, Nome: 'RODA JEANS CONSTURADA 20CM', ValorPrecoFixado: 36, PrecoCusto: 32, EstoqueUnidade: 'UN' },
    { Codigo: 87, Nome: 'RODA PG 150X150 GRAO 320', ValorPrecoFixado: 95, PrecoCusto: 88, EstoqueUnidade: 'UN' },
    { Codigo: 69, Nome: 'RODA PG 150X50 GR 120', ValorPrecoFixado: 73, PrecoCusto: 68, EstoqueUnidade: 'UN' },
    { Codigo: 91, Nome: 'RODA PG 150X50 GR 150', ValorPrecoFixado: 88, PrecoCusto: 72, EstoqueUnidade: 'UN' },
    { Codigo: 72, Nome: 'RODA PG 150X50 GR 220', ValorPrecoFixado: 85, PrecoCusto: 76, EstoqueUnidade: 'UN' },
    { Codigo: 78, Nome: 'RODA TRANSISAL COMPACTA ALGODAO 20CM', ValorPrecoFixado: 40, PrecoCusto: 34, EstoqueUnidade: 'UN' },
    { Codigo: 63, Nome: 'SERRA ACO RAP FLEX 1218 BOM STARRET (GROSSA )', ValorPrecoFixado: 10, PrecoCusto: 8, EstoqueUnidade: 'UN' },
    { Codigo: 57, Nome: 'SERRA ACO RAP FLEX KBS STARRETT', ValorPrecoFixado: 10, PrecoCusto: 6, EstoqueUnidade: 'UN' },
    { Codigo: 107, Nome: 'TELA A06', ValorPrecoFixado: 0, PrecoCusto: 15, EstoqueUnidade: 'UN' },
    { Codigo: 53, Nome: 'TORRE PINÇA 400mm C/2 FUROS', ValorPrecoFixado: 100, PrecoCusto: 41, EstoqueUnidade: 'UN' },
    { Codigo: 109, Nome: 'TRENA 10MT', ValorPrecoFixado: 25, PrecoCusto: 18, EstoqueUnidade: 'UN' },
    { Codigo: 13, Nome: 'TRENA ACO MILLA 5MT', ValorPrecoFixado: 15, PrecoCusto: 9, EstoqueUnidade: 'UN' },
    { Codigo: 12, Nome: 'TRENA ACO MILLA 7.5 MT', ValorPrecoFixado: 20, PrecoCusto: 9, EstoqueUnidade: 'UN' },
    { Codigo: 80, Nome: 'TUBO RED INOX 1.1/2 1.2 6MT', ValorPrecoFixado: 248, PrecoCusto: 200, EstoqueUnidade: 'UN' },
    { Codigo: 64, Nome: 'TUBO RED INOX 304 2P 1.20 6MT', ValorPrecoFixado: 350, PrecoCusto: 250, EstoqueUnidade: 'UN' },
    { Codigo: 88, Nome: 'TUBO RED INOX 304 3/4 1.2 6MT', ValorPrecoFixado: 140, PrecoCusto: 100, EstoqueUnidade: 'UN' },
    { Codigo: 124, Nome: 'arremate F cerejeira', ValorPrecoFixado: 38, PrecoCusto: 22, EstoqueUnidade: 'UN' },
    { Codigo: 112, Nome: 'arremate imbuia F', ValorPrecoFixado: 36, PrecoCusto: 22, EstoqueUnidade: 'UN' },
    { Codigo: 103, Nome: 'arremate stily mogno', ValorPrecoFixado: 40, PrecoCusto: 27, EstoqueUnidade: 'UN' },
    { Codigo: 46, Nome: 'arremate styli 8mt', ValorPrecoFixado: 30, PrecoCusto: 19, EstoqueUnidade: 'UN' },
    { Codigo: 101, Nome: 'arremate tipo gesso 6mt mogno', ValorPrecoFixado: 45, PrecoCusto: 32, EstoqueUnidade: 'UN' },
    { Codigo: 104, Nome: 'arremate tipo u mogno', ValorPrecoFixado: 36, PrecoCusto: 25, EstoqueUnidade: 'UN' },
    { Codigo: 4, Nome: 'caixa de parafuso DRAYWALL', ValorPrecoFixado: 60, PrecoCusto: 30, EstoqueUnidade: 'UN' },
    { Codigo: 2, Nome: 'caixa de parafuso parede', ValorPrecoFixado: 60, PrecoCusto: 30, EstoqueUnidade: 'UN' },
    { Codigo: 3, Nome: 'caixa de parafuso ripa', ValorPrecoFixado: 60, PrecoCusto: 30, EstoqueUnidade: 'UN' },
    { Codigo: 128, Nome: 'disco de corte 4.1/2', ValorPrecoFixado: 3, PrecoCusto: 1.75, EstoqueUnidade: 'UN' },
    { Codigo: 102, Nome: 'metalon 15x15', ValorPrecoFixado: 20, PrecoCusto: 12, EstoqueUnidade: 'UN' },
    { Codigo: 5, Nome: 'c', ValorPrecoFixado: 40, PrecoCusto: 25, EstoqueUnidade: 'UN' },
    { Codigo: 6, Nome: 'pacote de bucha sem anel', ValorPrecoFixado: 25, PrecoCusto: 15, EstoqueUnidade: 'UN' },
    { Codigo: 77, Nome: 'parafuso de ripa 3,5x12 UNID', ValorPrecoFixado: 0.1, PrecoCusto: 0.05, EstoqueUnidade: 'UN' },
    { Codigo: 111, Nome: 'plastilon', ValorPrecoFixado: 20, PrecoCusto: 12, EstoqueUnidade: 'UN' },
];

// --- START: SPREADSHEET FUNCTION CALLING TOOLS ---
const spreadsheetTools: FunctionDeclaration[] = [
    {
        name: 'get_info',
        description: 'Gets information about the spreadsheet, like total row count and column names.',
        parameters: { type: Type.OBJECT, properties: {} }
    },
    {
        name: 'delete_rows',
        description: 'Deletes entire rows from the spreadsheet based on a condition.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                condition: {
                    type: Type.OBJECT,
                    properties: {
                        column: { type: Type.STRING, description: 'The column header or letter (e.g., "A", "B") to check.' },
                        operator: { type: Type.STRING, enum: ['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'NOT_CONTAINS', 'IS_EMPTY', 'IS_NOT_EMPTY', 'GREATER_THAN', 'LESS_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN_OR_EQUAL', 'IS_DUPLICATE'], description: 'The comparison operator.' },
                        value: { type: Type.STRING, description: 'The value to compare against.' }
                    },
                    required: ['column', 'operator']
                }
            },
            required: ['condition']
        }
    },
     {
        name: 'delete_columns',
        description: 'Deletes one or more columns from the spreadsheet based on their header name or letter.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                columns: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'An array of exact column header names or letters (e.g., ["A", "C"]) to delete.' },
            },
            required: ['columns']
        }
    },
    {
        name: 'update_cells',
        description: 'Updates cell values based on a transformation or by setting a new static value.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                columns: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'An array of column header names or letters to apply the transformation to.' },
                transformation: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['UPPERCASE', 'LOWERCASE', 'PROPER_CASE', 'TRIM_SPACES', 'REMOVE_CHARACTERS', 'REPLACE_TEXT', 'SET_VALUE'], description: 'The type of transformation to apply.'},
                        params: {
                            type: Type.OBJECT,
                            properties: {
                                characters_to_remove: { type: Type.ARRAY, items: { type: Type.STRING } },
                                old_text: { type: Type.STRING },
                                new_text: { type: Type.STRING },
                                value: { type: Type.STRING }
                            }
                        }
                    },
                    required: ['type']
                }
            },
            required: ['columns', 'transformation']
        }
    },
    {
        name: 'apply_style',
        description: 'Applies visual styles like bold, color, and alignment to cells based on conditions.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                style: {
                    type: Type.OBJECT,
                    description: 'An object of CSS styles to apply.',
                    properties: {
                        fontWeight: { type: Type.STRING }, color: { type: Type.STRING }, backgroundColor: { type: Type.STRING }, textAlign: { type: Type.STRING }, fontSize: { type: Type.STRING },
                    },
                },
                condition: {
                    type: Type.OBJECT,
                    description: "A condition to apply styling dynamically to entire rows based on a column's value.",
                    properties: {
                        column: { type: Type.STRING, description: "The column name or letter to check." },
                        operator: { type: Type.STRING, enum: ['EQUALS', 'CONTAINS', 'GREATER_THAN', 'LESS_THAN', 'IS_DUPLICATE'] },
                        value: { type: Type.STRING, description: 'The value to compare against (can be text or a number as a string).' }
                    },
                     required: ['column', 'operator', 'value']
                }
            },
            required: ['style', 'condition']
        }
    },
    {
        name: 'sort_data',
        description: 'Sorts all data rows based on the values in one or more specified columns.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                criteria: {
                    type: Type.ARRAY,
                    description: 'An array of columns to sort by, in order of precedence.',
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            column: { type: Type.STRING, description: 'The header name or letter of the column to sort by.' },
                            direction: { type: Type.STRING, enum: ['ASC', 'DESC'], description: 'Sort direction: ASC for ascending, DESC for descending. Defaults to ASC.' }
                        },
                        required: ['column']
                    }
                }
            },
            required: ['criteria']
        }
    },
    {
        name: 'filter_rows',
        description: 'Filters the spreadsheet, keeping only the rows that match a specific condition. This modifies the current view.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                condition: {
                    type: Type.OBJECT,
                    properties: {
                        column: { type: Type.STRING, description: 'The column header or letter to check.' },
                        operator: { type: Type.STRING, enum: ['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'NOT_CONTAINS', 'IS_EMPTY', 'IS_NOT_EMPTY', 'GREATER_THAN', 'LESS_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN_OR_EQUAL', 'IS_DUPLICATE'], description: 'The comparison operator.' },
                        value: { type: Type.STRING, description: 'The value to compare against. For numeric comparisons, provide a number as a string.' }
                    },
                    required: ['column', 'operator']
                }
            },
            required: ['condition']
        }
    },
    {
        name: 'add_column',
        description: 'Adds a new column to the spreadsheet, optionally with a default value for all rows.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: 'The header name for the new column.' },
                defaultValue: { type: Type.STRING, description: 'An optional default value to fill in for all existing data rows.' }
            },
            required: ['name']
        }
    },
    {
        name: 'rename_column',
        description: 'Renames an existing column.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                oldName: { type: Type.STRING, description: 'The current header name or letter of the column to rename.' },
                newName: { type: Type.STRING, description: 'The new header name for the column.' }
            },
            required: ['oldName', 'newName']
        }
    },
    {
        name: 'format_numbers',
        description: 'Formats numeric values in a column as currency, percentage, or with a fixed number of decimal places.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                columns: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'An array of column names or letters to format.' },
                format: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['CURRENCY', 'PERCENTAGE', 'FIXED_DECIMAL'], description: 'The type of number format to apply.' },
                        currencyCode: { type: Type.STRING, description: 'The ISO 4217 currency code, e.g., "BRL" or "USD". Required for CURRENCY type.' },
                        decimalPlaces: { type: Type.NUMBER, description: 'The number of decimal places to show.' }
                    },
                    required: ['type']
                }
            },
            required: ['columns', 'format']
        }
    },
    {
        name: 'delete_duplicate_rows',
        description: 'Deletes entire rows that are duplicates based on the value in a specific column, keeping the first occurrence.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                column: { type: Type.STRING, description: 'The column header or letter to check for duplicate values.' },
            },
            required: ['column']
        }
    },
    {
        name: 'find_anomalies',
        description: 'Analyzes the spreadsheet for data quality issues and anomalies, such as duplicate values or mismatched data types.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                analysis_type: { type: Type.STRING, enum: ['DUPLICATES', 'DATATYPES'], description: 'The type of anomaly to look for.' },
                column: { type: Type.STRING, description: 'The specific column header or letter to analyze. If not provided, some analyses may scan all columns.' },
            },
            required: ['analysis_type']
        }
    },
    {
        name: 'move_data',
        description: 'Moves data from a source range to a destination cell. The source data is cleared after the move.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                source_range: { type: Type.STRING, description: 'The source range to move, in A1 notation (e.g., "A1:A10", "C:C").' },
                destination_start_cell: { type: Type.STRING, description: 'The top-left cell of the destination, in A1 notation (e.g., "B1").' },
            },
            required: ['source_range', 'destination_start_cell']
        }
    },
    {
        name: 'copy_data',
        description: 'Copies data from a source range to a destination cell. The source data is not cleared.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                source_range: { type: Type.STRING, description: 'The source range to copy, in A1 notation (e.g., "A1:A10", "C:C").' },
                destination_start_cell: { type: Type.STRING, description: 'The top-left cell of the destination, in A1 notation (e.g., "B1").' },
            },
            required: ['source_range', 'destination_start_cell']
        }
    },
    {
        name: 'clear_contents',
        description: 'Deletes the data within a specified range of cells without deleting the rows or columns.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                range: { type: Type.STRING, description: 'The range of cells to clear, in A1 notation (e.g., "A1:B10", "C:C", "3:3").' },
            },
            required: ['range']
        }
    }
];
// --- END: SPREADSHEET FUNCTION CALLING TOOLS ---
// Fix: Import mockPodcasts to resolve 'Cannot find name' error.
const mockPodcasts = [
    {
        show: {
            id: 'flow-podcast',
            title: 'Flow Podcast',
            description: 'O Flow Podcast é uma conversa livre, como um papo de boteco, com convidados das mais diversas áreas.',
            artworkUrl: 'https://i1.sndcdn.com/avatars-000621443475-151z6w-t500x500.jpg',
            rssUrl: 'https://flowpodcast.com.br/feed/',
            author: 'Estúdios Flow',
            categories: ['Conversa', 'Comédia'],
            isSubscribed: true,
        },
        episodes: [
            { id: 'flow-ep1', showId: 'flow-podcast', title: 'Episódio com especialista em IA', description: 'Uma conversa profunda sobre o futuro da inteligência artificial.', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', releaseDate: new Date().toISOString(), duration: 165 },
            { id: 'flow-ep2', showId: 'flow-podcast', title: 'Debate sobre exploração espacial', description: 'Elon Musk vs Jeff Bezos, quem vencerá a corrida espacial?', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', releaseDate: new Date(Date.now() - 86400000).toISOString(), duration: 165 },
        ]
    },
    {
        show: {
            id: 'podpah-podcast',
            title: 'Podpah',
            description: 'Igão e Mítico recebem convidados para uma conversa descontraída sobre os mais variados assuntos.',
            artworkUrl: 'https://pbcdn.podbean.com/imglogo/image-logo/9844973/podpah_-_logo_y93d-p3.jpg',
            rssUrl: 'https://podpah.com.br/feed/',
            author: 'Podpah',
            categories: ['Comédia', 'Entrevistas'],
            isSubscribed: true,
        },
        episodes: [
            { id: 'podpah-ep1', showId: 'podpah-podcast', title: 'Histórias do Futebol', description: 'Um ex-jogador conta os bastidores do futebol brasileiro.', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', releaseDate: new Date(Date.now() - 172800000).toISOString(), duration: 165 },
        ]
    }
];

const add_to_whiteboard: FunctionDeclaration = {
    name: 'add_to_whiteboard',
    description: 'Adiciona um novo card de anotações à Lousa Criativa para exibir informações importantes, resultados de cálculos ou diagramas para o usuário.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            content: {
                type: Type.STRING,
                description: 'O conteúdo do card, formatado em Markdown. A primeira linha, se for um cabeçalho (# Título), será usada como título do card.'
            }
        },
        required: ['content']
    }
};

const calculate_ceiling_materials_tool: FunctionDeclaration = {
    name: 'calculate_ceiling_materials',
    description: 'Calcula os materiais necessários para um forro dadas as suas dimensões e tipo (drywall ou pvc-liso).',
    parameters: {
        type: Type.OBJECT,
        properties: {
            length: { type: Type.NUMBER, description: 'O comprimento do ambiente em metros.' },
            width: { type: Type.NUMBER, description: 'A largura do ambiente em metros.' },
            ceiling_type: { type: Type.STRING, enum: ['drywall', 'pvc-liso'], description: "O tipo de forro a ser calculado." }
        },
        required: ['length', 'width', 'ceiling_type']
    }
};


const useNeuralAssistant = (initialMode: PersistenceMode) => {
    const [persistenceMode, setPersistenceMode] = useState<PersistenceMode>(initialMode);
    const [appState, setAppState, isDbActive, dbStatus, initializePersistence] = usePersistence(setPersistenceMode);
    
    const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
    const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.IDLE);
    const [interactionMode, _setInteractionMode] = useState<InteractionMode>('chat');
    const [textInput, setTextInput] = useState('');
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const imageBase64Ref = useRef<string | null>(null);
    const [productCatalog, setProductCatalog] = useState<Product[]>(productCatalogData);

    // Panels State
    const [activePanels, setActivePanels] = useState<Record<string, boolean>>({});
    
    // Live Conversation State
    const [liveTranscript, setLiveTranscript] = useState({ user: '', assistant: '' });
    const [liveModeTranscriptions, setLiveModeTranscriptions] = useState<Transcription[]>([]);
    const [processingQueue, setProcessingQueue] = useState<LiveDocument[]>([]);
    const [coCreatorSpecialization, setCoCreatorSpecialization] = useState('Editor Especialista');
    const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
    const [justSavedIds, setJustSavedIds] = useState(new Set<string>());
    const [justCopiedId, setJustCopiedId] = useState<string | null>(null);
    const [justCopiedTagsId, setJustCopiedTagsId] = useState<string | null>(null);
    const restartConversationAfterContextSwitch = useRef(false);
    
    // ... other state variables
    const [activeSearchContexts, setActiveSearchContexts] = useState<Set<string>>(new Set(['web']));
    const [dynamicSearchContexts, setDynamicSearchContexts] = useState<any[]>([]);
    const [isWebSearchForced, setIsWebSearchForced] = useState(false);
    const [videoSearchResults, setVideoSearchResults] = useState<Video[]>([]);
    const [isIngesting, setIsIngesting] = useState(false);
    const [mediaPlayerUrl, setMediaPlayerUrl] = useState<string | null>(null);
    const [informationCards, setInformationCards] = useState<InformationCard[]>([]);
    const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);
    const [firedReminders, setFiredReminders] = useState<Set<string>>(new Set());
    const [deepAnalysisState, setDeepAnalysisState] = useState<DeepAnalysisState>({ isOpen: false, isLoading: false, progress: 0, statusMessage: '', fileName: null, fileDataUrl: null, error: null, result: null});
    const [groundedSearchState, setGroundedSearchState] = useState<GroundedSearchState>({isLoading: false, error: null, result: null });
    const [projectAssistantState, setProjectAssistantState] = useState<ProjectAssistantState>({ userGoal: '', userTech: '', userIdeas: '', generatedPlan: null, isLoading: false, error: null });
    const [isProjectAssistantModeActive, setIsProjectAssistantModeActive] = useState(false);
    const [deepDiveResources, setDeepDiveResources] = useState<MagazineResource[] | null>(null);
    const [imageGenerationState, setImageGenerationState] = useState<ImageGenerationState>({ 
        isLoading: false, 
        error: null, 
        generations: [],
        mode: 'generate',
        imageToEdit: null,
    });
    const [replicateApiStatus, setReplicateApiStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
    const [spotifyState, setSpotifyState] = useState<SpotifyState>({
        isLoading: false,
        error: null,
        topTracks: [],
        createdPlaylistId: null,
        statusMessage: '',
    });
    const [spotifyTokenStatus, setSpotifyTokenStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
    const [serpApiState, setSerpApiState] = useState<SerpApiState>({ isLoading: false, error: null, query: '', cardResult: null, magazineResult: null });
    const [serpApiStatus, setSerpApiStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
    const [isProcessingPersonality, setIsProcessingPersonality] = useState(false);
    const [isSpreadsheetLoading, setIsSpreadsheetLoading] = useState(false);
    const [spreadsheetError, setSpreadsheetError] = useState<string | null>(null);


    // Services and Hooks
    const chatRef = useRef<Chat | null>(null);
    const googleDrive = useGoogleDrive();
    const isFirstAssistantTurnInSpreadsheet = useRef(false);
    // Fix: Integrate useRssReader hook to provide data and refresh functionality to the RssFeedPanel.
    const { articles: rssArticles, isLoading: isRssLoading, error: rssError, refreshFeeds: refreshRssFeeds } = useRssReader();

    const getActiveApiKey = useCallback(() => {
        return appState.apiKeys.find(k => k.id === appState.settings.activeApiKeyId)?.value || null;
    }, [appState.apiKeys, appState.settings.activeApiKeyId]);

    const { play: playTTS, pause: pauseTTS, resume: resumeTTS, stop: stopTTS, ttsState } = useTextToSpeech({
        apiKey: getActiveApiKey(),
        voiceName: appState.settings.selectedVoice,
        selectedBrowserVoice: appState.settings.selectedBrowserVoice,
        rate: appState.settings.speechRate,
        volume: appState.settings.volume,
    });
    
    const onVolumeChange = useCallback((volume: number) => {
        setAppState(prev => ({ ...prev, settings: { ...prev.settings, volume } }));
    }, [setAppState]);

    const onCopyToClipboard = useCallback((content: ReportContent, transcriptionId: string) => {
        const textToCopy = [
            `# ${content.title}`,
            content.summary,
            ...content.sections.map(s => `## ${s.heading}\n${s.content}`)
        ].join('\n\n');
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                setJustCopiedId(transcriptionId);
                setTimeout(() => setJustCopiedId(null), 2000); // Feedback for 2 seconds
            })
            .catch(err => {
                console.error('Failed to copy content: ', err);
                alert('Falha ao copiar para a área de transferência. Verifique as permissões do seu navegador.');
            });
    }, []);

    const onCopyTagsToClipboard = useCallback((tags: string[], transcriptionId: string) => {
        if (!tags || tags.length === 0) return;
        navigator.clipboard.writeText(tags.join(', '))
            .then(() => {
                setJustCopiedTagsId(transcriptionId);
                setTimeout(() => setJustCopiedTagsId(null), 2000); // Feedback for 2 seconds
            })
            .catch(err => {
                console.error('Failed to copy tags: ', err);
                alert('Falha ao copiar tags para a área de transferência.');
            });
    }, []);

    const onSaveToMagazine = useCallback((transcriptionId: string) => {
        const transcriptionToSave = transcriptions.find(t => t.id === transcriptionId);
        if (transcriptionToSave?.reportContent) {
            const tagsInput = window.prompt("Adicione tags para esta reportagem (separadas por vírgula):", transcriptionToSave.reportContent.tags?.join(', ') || '');
            const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];
            
            const updatedTranscription = {
                ...transcriptionToSave,
                reportContent: {
                    ...transcriptionToSave.reportContent,
                    tags: tags
                }
            };
            
            setAppState(prev => ({
                ...prev,
                magazine: [updatedTranscription, ...prev.magazine.filter(m => m.id !== transcriptionId)] // Adiciona ou atualiza
            }));
    
            setJustSavedIds(prev => new Set(prev).add(transcriptionId));
            setTimeout(() => {
                setJustSavedIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(transcriptionId);
                    return newSet;
                });
            }, 2000); // Feedback visual por 2 segundos
        }
    }, [transcriptions, setAppState]);

    const onCopySlateCardContent = (content: string) => {
        navigator.clipboard.writeText(content).catch(err => {
            console.error('Failed to copy content: ', err);
        });
    };

    const onDeleteSlateCard = (id: string) => {
        setAppState(prev => ({
            ...prev,
            creativeSlate: prev.creativeSlate.filter(card => card.id !== id)
        }));
    };
    
    const processWhiteboardForPersonality = useCallback(async () => {
        const apiKey = getActiveApiKey();
        if (!apiKey) {
            alert("API Key not configured.");
            return;
        }
        if (appState.creativeSlate.length === 0) {
            alert("A lousa criativa está vazia. Adicione algumas notas antes de processar.");
            return;
        }
    
        setIsProcessingPersonality(true);
        try {
            const whiteboardContent = appState.creativeSlate
                .map(card => `Title: ${card.title}\nContent:\n${card.content}`)
                .join('\n\n---\n\n');
    
            const ai = new GoogleGenAI({ apiKey });
    
            const prompt = `
                Analyze the following collection of texts from a creative whiteboard. Based on the overall tone, style, and subject matter, generate a multi-faceted personality profile. Rate each of the following traits on a continuous scale from 0.0 (not present at all) to 1.0 (extremely dominant).
    
                **Whiteboard Content:**
                ---
                ${whiteboardContent}
                ---
    
                **Analysis Dimensions:**
                1.  **Personality Profile (5 values):**
                    -   Choleric (Assertive, decisive, goal-oriented)
                    -   Melancholic (Analytical, detailed, thoughtful)
                    -   Sanguine (Enthusiastic, creative, social)
                    -   Phlegmatic (Calm, steady, reliable)
                    -   Cognitive (Purely logical, data-driven, abstract)
    
                2.  **Content Axis (5 values):**
                    -   Factual (Based on data, evidence, and concrete information)
                    -   Creative (Imaginative, artistic, story-driven)
                    -   Technical (Focused on how-to, implementation, systems)
                    -   Dialogical (Conversational, question-based, relational)
                    -   Synthetic (Connects disparate ideas, finds patterns, summarizes)
    
                3.  **Interactivity Axis (5 values):**
                    -   Imperative (Gives commands, instructions, direct calls to action)
                    -   Exploratory (Asks open-ended questions, suggests possibilities)
                    -   Collaborative (Uses "we", "let's", invites participation)
                    -   Passive (Presents information without explicit direction)
                    -   Socratic (Leads through questioning to guide discovery)
    
                Your output MUST be a valid JSON object matching the provided schema. Do not include any text outside of the JSON object.
            `;
    
            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    personality: {
                        type: Type.ARRAY,
                        description: "Array of 5 numbers (0.0-1.0) for the personality profile.",
                        items: { type: Type.NUMBER },
                    },
                    content: {
                        type: Type.ARRAY,
                        description: "Array of 5 numbers (0.0-1.0) for the content axis.",
                        items: { type: Type.NUMBER },
                    },
                    interactivity: {
                        type: Type.ARRAY,
                        description: "Array of 5 numbers (0.0-1.0) for the interactivity axis.",
                        items: { type: Type.NUMBER },
                    },
                },
                required: ['personality', 'content', 'interactivity'],
            };
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema,
                },
            });
    
            const resultJson = JSON.parse(sanitizeJsonResponse(response.text));
    
            // Basic validation
            if (
                resultJson.personality?.length === 5 &&
                resultJson.content?.length === 5 &&
                resultJson.interactivity?.length === 5
            ) {
                setAppState(prev => ({
                    ...prev,
                    personalityFrameworkData: resultJson,
                }));
            } else {
                throw new Error("Invalid data structure received from AI.");
            }
    
        } catch (error) {
            console.error("Failed to process whiteboard for personality:", error);
            alert(`An error occurred: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setIsProcessingPersonality(false);
        }
    }, [getActiveApiKey, appState.creativeSlate, setAppState]);

    const coCreatorTools: FunctionDeclaration[] = [
      {
        name: 'replace_text',
        description: 'Substitui um trecho de texto no documento por um novo texto. Use para correções, reescritas ou adições.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            text_to_replace: {
              type: Type.STRING,
              description: 'O trecho exato do texto a ser substituído. Deve ser uma correspondência exata de uma parte do documento.'
            },
            new_text: {
              type: Type.STRING,
              description: 'O novo texto que substituirá o antigo.'
            }
          },
          required: ['text_to_replace', 'new_text']
        }
      },
      {
        name: 'apply_format',
        description: "Aplica formatação de negrito ('bold') ou itálico ('italic') a um trecho de texto no documento.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            text_to_format: {
              type: Type.STRING,
              description: 'O trecho exato do texto a ser formatado.'
            },
            format_type: {
              type: Type.STRING,
              description: "O tipo de formatação a ser aplicado, deve ser 'bold' ou 'italic'."
            }
          },
          required: ['text_to_format', 'format_type']
        }
      }
    ];

    const onSetDocumentContent = (docId: string, content: string) => {
        setAppState(prev => ({
            ...prev,
            documents: prev.documents.map(d => d.id === docId ? { ...d, content, lastModified: new Date().toISOString() } : d)
        }));
    };

    const handleLiveTranscriptionUpdate = useCallback(({ user, assistant }: { user?: string, assistant?: string }) => {
        setLiveTranscript(prev => ({
            user: user === undefined ? prev.user : user,
            assistant: assistant === undefined ? prev.assistant : assistant,
        }));
    }, []);

    const handleTurnComplete = useCallback((transcription: Transcription) => {
        if (activePanels.spreadsheet && transcription.speaker === 'user' && transcription.text.trim()) {
            setAppState(prev => ({ ...prev, spreadsheetState: { ...prev.spreadsheetState, lastCommand: transcription.text }}));
        }

        if (interactionMode === 'live' || interactionMode === 'cocreator') {
            setLiveModeTranscriptions(prev => [...prev, transcription]);
        }
        setLiveTranscript({ user: '', assistant: '' });
    }, [interactionMode, activePanels.spreadsheet, setAppState]);
    
    const onFunctionCallRef = useRef((name: string, args: any, id: string) => {});
    const handleFunctionCallProxy = useCallback((name: string, args: any, id: string) => {
        onFunctionCallRef.current(name, args, id);
    }, []);

    const getSystemInstruction = useCallback(() => {
        if (interactionMode === 'live') {
            return "Você é um assistente de IA conversacional especializado em construção de andaimes. Converse com o usuário por voz, respondendo a perguntas sobre segurança, ferramentas e cálculos. Use a ferramenta 'add_to_whiteboard' quando o usuário pedir explicitamente para anotar algo, como 'coloque na lousa'.";
        }
        if (interactionMode === 'chat') {
            return "Você é um consultor especialista na execução e construção de forros (drywall, pvc) e andaimes. Sua especialidade inclui equipamentos de segurança (EPI), ferramentas e cálculo de materiais para gerar orçamentos. Você pode analisar imagens de plantas baixas desenhadas para extrair medidas. Use as ferramentas `calculate_ceiling_materials` e `calculate_scaffolding_materials` para responder a pedidos de cálculo e orçamento. Responda em Português do Brasil.";
        }
        return "Você é um assistente prestativo.";
    }, [interactionMode]);

    const getTools = useCallback(() => {
        let tools: any[] = [];
        if (interactionMode === 'cocreator') {
            tools.push({ functionDeclarations: coCreatorTools });
        } else if (interactionMode === 'chat') {
            tools.push({ functionDeclarations: [
                add_to_whiteboard,
                calculate_ceiling_materials_tool,
            ]});
        } else {
             tools.push({ functionDeclarations: [add_to_whiteboard] });
        }
        
        if (isWebSearchForced || activeSearchContexts.has('web')) {
            tools.push({ googleSearch: {} });
        }
        return tools;
    }, [interactionMode, isWebSearchForced, activeSearchContexts]);

    const {
        connectionState: liveConnectionState,
        startConversation,
        stopConversation,
        stopAudioPlayback,
        sendToolResponse,
        sendMedia,
        sendText,
    } = useLiveConversation(
        getActiveApiKey(),
        appState.settings.selectedVoice,
        getSystemInstruction(),
        true, // Enable transcription for live conversation
        handleLiveTranscriptionUpdate,
        handleTurnComplete,
        handleFunctionCallProxy,
        getTools()
    );

    const toggleConversationMode = useCallback(() => {
        const isLive = interactionMode === 'live' || interactionMode === 'cocreator' || activePanels.spreadsheet;
        if (isLive) {
            if (liveConnectionState !== ConnectionState.IDLE) {
                stopConversation();
            } else {
                navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(stream => {
                    startConversation(stream);
                }).catch(err => {
                    console.error("Could not get microphone access:", err);
                    alert("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
                });
            }
        } else {
            setInteractionMode('live');
        }
    }, [interactionMode, liveConnectionState, startConversation, stopConversation, activePanels.spreadsheet]);
    
    // This effect will handle restarting the conversation after a context switch
    useEffect(() => {
        if (restartConversationAfterContextSwitch.current && liveConnectionState === ConnectionState.IDLE) {
            toggleConversationMode(); // This will use the new context from getSystemInstruction/getTools
            restartConversationAfterContextSwitch.current = false;
        }
    }, [liveConnectionState, toggleConversationMode]);

    const handleFunctionCall = useCallback((name: string, args: any, id: string) => {
        if (name === 'add_to_whiteboard') {
            const newCard: SlateCard = { 
                id: uuidv4(), 
                title: `Nota de ${new Date().toLocaleTimeString()}`, 
                content: args.content, 
                summary: '', 
                tags: ['anotado'], 
                createdAt: new Date().toISOString() 
            };
            setAppState(prev => ({ ...prev, creativeSlate: [...prev.creativeSlate, newCard] }));
            sendToolResponse(id, name, { success: true, message: "Anotado na lousa." });
            return;
        }

        // Handle other function calls like spreadsheet or cocreator
        // ... (existing spreadsheet/cocreator logic)
    }, [sendToolResponse, setAppState]);


    useEffect(() => {
        onFunctionCallRef.current = handleFunctionCall;
    }, [handleFunctionCall]);

    const setInteractionMode = (mode: InteractionMode) => {
        if (mode === 'live' && interactionMode !== 'live') {
            setLiveModeTranscriptions([]);
        }
        if (mode !== 'live' && interactionMode === 'live' && liveConnectionState !== ConnectionState.IDLE) {
            stopConversation();
        }
        _setInteractionMode(mode);
    };

    useEffect(() => {
        const isLiveMode = interactionMode === 'live' || interactionMode === 'cocreator' || activePanels.spreadsheet;
        if (isLiveMode) {
            setConnectionState(liveConnectionState);
        } else if (connectionState !== ConnectionState.THINKING && connectionState !== ConnectionState.SAVING) {
            setConnectionState(ConnectionState.IDLE);
        }
    }, [liveConnectionState, interactionMode, connectionState, activePanels.spreadsheet]);

    useEffect(() => {
        if (interactionMode === 'cocreator' && liveConnectionState === ConnectionState.CONNECTED) {
            const doc = appState.documents.find(d => d.id === activeDocumentId);
            if (doc) {
                const contextMessage = `Vamos colaborar neste documento. O seu papel é '${coCreatorSpecialization}'. Eu darei comandos de voz e você usará as ferramentas disponíveis para editar o texto. Aqui está o conteúdo atual do documento para seu contexto:\n\n---\n\n${doc.content}`;
                sendText(contextMessage);
            }
        }
    }, [interactionMode, liveConnectionState, activeDocumentId, coCreatorSpecialization, appState.documents, sendText]);

    const onTranscriptionComplete = (text: string) => {
        onSendMessage(text);
    };

    const { recordingState, startRecording, stopRecording, elapsedTime, transcriptionProgress } = useAudioService(onTranscriptionComplete, getActiveApiKey());

    const cancelBatchProcessing = useCallback(() => {
        setProcessingQueue([]);
        if (connectionState === ConnectionState.LOADING_FILE) {
            setConnectionState(interactionMode === 'live' ? ConnectionState.CONNECTED : ConnectionState.IDLE);
        }
    }, [connectionState, interactionMode]);

    const handleFilesSelect = useCallback(async (files: FileList) => {
        if (!files.length) return;
        const apiKey = getActiveApiKey();
        if (!apiKey) {
            alert("A chave de API é necessária para processar imagens.");
            return;
        }

        setConnectionState(ConnectionState.LOADING_FILE);
        const newDocs: LiveDocument[] = Array.from(files).map(file => ({
            id: uuidv4(),
            name: file.name,
            status: 'pending',
            previewUrl: URL.createObjectURL(file), 
        }));
        setProcessingQueue(prev => [...prev, ...newDocs]);
        
        const ai = new GoogleGenAI({ apiKey });
        
        for (const [index, file] of Array.from(files).entries()) {
            const doc = newDocs[index];
            setProcessingQueue(prev => prev.map(d => d.id === doc.id ? {...d, status: 'processing'} : d));
            
            try {
                const base64Data = await blobToBase64(file as Blob);
                const imagePart = { inlineData: { mimeType: file.type, data: base64Data } };
                
                const promptText = "Realize uma análise profunda desta imagem. Extraia todo o texto visível. Após o texto, forneça uma breve descrição do conteúdo visual da imagem. Formate a saída de forma clara, separando o texto extraído da descrição.";
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: [imagePart, { text: promptText }] },
                });
                
                const extractedContent = response.text;
                const newCard: SlateCard = {
                    id: uuidv4(),
                    title: `Análise da Imagem: ${file.name}`,
                    content: extractedContent,
                    summary: `Análise da imagem ${file.name}`,
                    tags: ['imagem', 'análise'],
                    createdAt: new Date().toISOString()
                };
                setAppState(prev => ({...prev, creativeSlate: [newCard, ...prev.creativeSlate]}));


                if (interactionMode === 'live') {
                    const contextMessage = `O conteúdo da imagem "${file.name}" foi analisado e adicionado à lousa. Podemos discutir sobre isso.`;
                    sendText(contextMessage);
                }

                setProcessingQueue(prev => prev.map(d => d.id === doc.id ? {...d, status: 'done'} : d));
            } catch (error) {
                console.error("Error processing file:", error);
                setProcessingQueue(prev => prev.map(d => d.id === doc.id ? {...d, status: 'error', errorMessage: 'Falha ao processar'} : d));
            }
        }
        
        setTimeout(() => {
            setProcessingQueue([]);
            setConnectionState(interactionMode === 'live' ? ConnectionState.CONNECTED : ConnectionState.IDLE);
        }, 2000);

    }, [getActiveApiKey, interactionMode, sendText, setAppState]);


    const onAddPostItNote = (noteData: Omit<PostItNote, 'id' | 'tags' | 'createdAt'>) => {
        const tags = noteData.content.match(/#\w+/g)?.map(tag => tag.substring(1)) || [];
        const newNote: PostItNote = {
            ...noteData,
            id: uuidv4(),
            tags,
            createdAt: new Date().toISOString(),
        };
        setAppState(prev => ({ ...prev, postItNotes: [...prev.postItNotes, newNote] }));
    };

    const onUpdatePostItNote = (id: string, updates: Partial<PostItNote>) => {
        setAppState(prev => ({
            ...prev,
            postItNotes: prev.postItNotes.map(note => {
                if (note.id === id) {
                    const updatedNote = { ...note, ...updates };
                    if (updates.content) {
                        updatedNote.tags = updates.content.match(/#\w+/g)?.map(tag => tag.substring(1)) || [];
                    }
                    return updatedNote;
                }
                return note;
            })
        }));
    };

    const onDeletePostItNote = (id: string) => {
        setAppState(prev => ({
            ...prev,
            postItNotes: prev.postItNotes.filter(note => note.id !== id)
        }));
    };

    const onProcessPostItText = async (text: string, mode: 'correct' | 'transform'): Promise<string> => {
        const apiKey = getActiveApiKey();
        if (!apiKey) {
            alert("API Key not configured.");
            return text;
        }

        const prompt = mode === 'correct'
            ? `Corrija a gramática e a ortografia do seguinte texto, mantendo o significado original. Retorne apenas o texto corrigido:\n\n"${text}"`
            : `Transforme o seguinte texto em uma lista de tarefas acionáveis ou um resumo conciso, extraindo a intenção principal. Formate como markdown simples. Retorne apenas o texto transformado:\n\n"${text}"`;

        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            return response.text;
        } catch (error) {
            console.error("Error processing text:", error);
            return text;
        }
    };

    const onPlayPostItTTS = (id: string, text: string) => {
        if (ttsState.playingId === id) {
            if (ttsState.isPaused) resumeTTS();
            else pauseTTS();
        } else {
            playTTS(cleanTextForTTS(text), id, true);
        }
    };

    const onScheduleEvent = useCallback((eventData: Omit<CalendarEvent, 'id' | 'status'>) => {
        const newEvent: CalendarEvent = {
            ...eventData,
            prerequisites: eventData.prerequisites || [],
            executionSteps: eventData.executionSteps || [],
            id: uuidv4(),
            status: 'pending',
        };
        setAppState(prev => ({
            ...prev,
            calendarEvents: [...prev.calendarEvents, newEvent]
        }));
        return `Evento "${newEvent.title}" agendado com sucesso para ${new Date(newEvent.date + 'T' + newEvent.time).toLocaleString('pt-BR')}.`;
    }, [setAppState]);

    const onEditEvent = useCallback((eventId: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => {
        setAppState(prev => ({
            ...prev,
            calendarEvents: prev.calendarEvents.map(e => e.id === eventId ? { ...e, ...updates } : e)
        }));
    }, [setAppState]);

    const onDeleteEvent = useCallback((eventId: string) => {
        setAppState(prev => ({
            ...prev,
            calendarEvents: prev.calendarEvents.filter(e => e.id !== eventId)
        }));
    }, [setAppState]);

    const onUpdateEventStatus = useCallback((eventIdOrTitle: string, newStatus?: 'pending' | 'completed') => {
        let confirmationMessage = `Evento "${eventIdOrTitle}" não encontrado.`;
        setAppState(prev => {
            const newEvents = prev.calendarEvents.map(event => {
                if (event.id === eventIdOrTitle || event.title.toLowerCase() === eventIdOrTitle.toLowerCase()) {
                    const finalStatus = newStatus !== undefined ? newStatus : (event.status === 'pending' ? 'completed' : 'pending');
                    if(event.status !== finalStatus) {
                        confirmationMessage = `Evento "${event.title}" marcado como ${finalStatus === 'completed' ? 'concluído' : 'pendente'}.`;
                    }
                    return { ...event, status: finalStatus };
                }
                return event;
            });
            return { ...prev, calendarEvents: newEvents };
        });
        return confirmationMessage;
    }, [setAppState]);
    
    useEffect(() => {
        const REMINDER_INTERVALS = [
            { minutes: 1440, label: '1d' },
            { minutes: 360, label: '6h' },
            { minutes: 60, label: '1h' },
            { minutes: 30, label: '30m' },
            { minutes: 15, label: '15m' },
        ];
    
        const checkReminders = () => {
            const now = Date.now();
            const newActiveReminders: Reminder[] = [];
    
            appState.calendarEvents.forEach(event => {
                if (event.status !== 'pending') return;
    
                try {
                    const eventTime = new Date(`${event.date}T${event.time}`).getTime();
                    if (isNaN(eventTime) || eventTime < now) return;
    
                    REMINDER_INTERVALS.forEach(interval => {
                        const reminderKey = `${event.id}-${interval.label}`;
                        if (firedReminders.has(reminderKey)) return;
    
                        const reminderTime = eventTime - (interval.minutes * 60 * 1000);
                        
                        if (now >= reminderTime && !activeReminders.some(r => r.id === reminderKey)) {
                            newActiveReminders.push({
                                id: reminderKey,
                                eventId: event.id,
                                eventTitle: event.title,
                                eventTime: event.time,
                                remindAt: eventTime,
                            });
                            setFiredReminders(prev => new Set(prev).add(reminderKey));
                        }
                    });
                } catch (e) {
                    console.error("Erro ao processar evento para lembretes:", event, e);
                }
            });
    
            if (newActiveReminders.length > 0) {
                setActiveReminders(prev => [...prev, ...newActiveReminders]);
            }
        };
    
        const intervalId = setInterval(checkReminders, 30000); // Verifica a cada 30 segundos
        return () => clearInterval(intervalId);
    }, [appState.calendarEvents, activeReminders, firedReminders]);

    const onSendMessage = useCallback(async (message: string) => {
        const apiKey = getActiveApiKey();
        if (!apiKey) {
            alert("Por favor, adicione e ative uma chave de API nas configurações.");
            setActivePanels(prev => ({ ...prev, settings: true }));
            return;
        }

        const userMessage: Transcription = {
            id: uuidv4(),
            speaker: 'user',
            text: message,
            timestamp: Date.now(),
            image: imagePreviewUrl ? { name: 'anexada', data: imagePreviewUrl } : undefined,
        };
        setTranscriptions(prev => [...prev, userMessage]);
        
        setTextInput('');
        setImagePreviewUrl(null);
        const imageBase64 = imageBase64Ref.current;
        imageBase64Ref.current = null;
        setConnectionState(ConnectionState.THINKING);
    
        try {
            const ai = new GoogleGenAI({ apiKey });

            if (imageBase64) {
                const imagePart = { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } };
                const visionPrompt = `Analyze the attached image of a hand-drawn floor plan or sketch. Your primary task is to extract the main dimensions (length and width) in meters. Also, determine if the user's text suggests a ceiling type ("drywall" or "pvc"). If no type is mentioned, default to "drywall". Respond ONLY with a valid JSON object containing "length", "width", and "ceiling_type" as keys. For example: {"length": 10, "width": 5.5, "ceiling_type": "drywall"}. User's text for context: "${message}"`;
                
                const visionResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: [imagePart, { text: visionPrompt }] }
                });

                let parsedDimensions;
                try {
                    parsedDimensions = JSON.parse(sanitizeJsonResponse(visionResponse.text));
                    if (typeof parsedDimensions.length !== 'number' || typeof parsedDimensions.width !== 'number') {
                        throw new Error("Invalid dimensions in JSON response.");
                    }
                } catch (e) {
                    const assistantMessage: Transcription = {
                        id: uuidv4(),
                        speaker: 'assistant',
                        text: "Não consegui extrair as dimensões da imagem. Por favor, verifique se o desenho está claro. A descrição da imagem é:\n\n" + visionResponse.text,
                        timestamp: Date.now(),
                    };
                    setTranscriptions(prev => [...prev, assistantMessage]);
                    setConnectionState(ConnectionState.IDLE);
                    return;
                }

                const { length, width, ceiling_type } = parsedDimensions;
                const ceilingType: CeilingType = (ceiling_type === 'pvc-liso' || ceiling_type === 'pvc') ? 'pvc-liso' : 'drywall';

                let calculationResultText = '';
                try {
                    const { results } = calculateCeilingMaterials(length, width, ceilingType, {}, productCatalog);
                    let materialsList = [
                        `- ${results.panels.count} ${results.panels.description}`,
                        `- ${results.mainStructure.count} ${results.mainStructure.description}`,
                        results.secondaryStructure ? `- ${results.secondaryStructure.count} ${results.secondaryStructure.description}` : null,
                        `- ${results.finishingProfiles.count} ${results.finishingProfiles.description}`,
                        results.hangers ? `- ${results.hangers} Tirantes/Pendurais` : null,
                        `- ${results.screws} Parafusos (aprox.)`,
                    ].filter(Boolean).join('\n');
                    
                    calculationResultText = `Com base na imagem, estimei as dimensões de ${length}m x ${width}m (área de ${results.area} m²). Para um forro de ${ceilingType}, a estimativa de materiais é:\n\n${materialsList}\n\n*Esta é uma estimativa. Recomendo confirmar as medidas no local.*`;
                } catch (e) {
                    calculationResultText = `Não foi possível calcular os materiais com as dimensões extraídas (${length}m x ${width}m). Erro: ${e instanceof Error ? e.message : 'Erro desconhecido'}`;
                }

                const assistantMessage: Transcription = { id: uuidv4(), speaker: 'assistant', text: calculationResultText, timestamp: Date.now() };
                setTranscriptions(prev => [...prev, assistantMessage]);
                setConnectionState(ConnectionState.IDLE);
                return;
            }
            
            // Text-only flow with function calling
            const model = 'gemini-2.5-flash';
            const config: any = { systemInstruction: getSystemInstruction() };
            const tools = getTools();
            if (tools.length > 0) {
                config.tools = tools;
            }
            
            const contents = { parts: [{ text: message }] };

            const genaiResponse = await ai.models.generateContent({ model, contents, config });

            let assistantText = genaiResponse.text;
            const functionCalls = genaiResponse.functionCalls;
            let resourceLinks: ResourceLink[] = [];

            if (functionCalls && functionCalls.length > 0) {
                const toolUseTranscription: Transcription = { id: uuidv4(), speaker: 'system', text: `Usando ferramenta: ${functionCalls.map(fc => fc.name).join(', ')}...`, timestamp: Date.now() };
                setTranscriptions(prev => [...prev, toolUseTranscription]);

                const functionResponses = [];
                for (const fc of functionCalls) {
                    let result: any;
                    if (fc.name === 'calculate_ceiling_materials') {
                        const { length, width, ceiling_type } = fc.args;
                        try {
                            const { results } = calculateCeilingMaterials(length, width, ceiling_type as CeilingType, {}, productCatalog);
                            const formattedResult = { area: results.area, materials: [ { item: results.panels.description, quantity: results.panels.count }, { item: results.mainStructure.description, quantity: results.mainStructure.count }, results.secondaryStructure ? { item: results.secondaryStructure.description, quantity: results.secondaryStructure.count } : null, { item: results.finishingProfiles.description, quantity: results.finishingProfiles.count }, results.hangers ? { item: "Tirantes/Pendurais", quantity: results.hangers } : null, { item: "Parafusos (aprox.)", quantity: results.screws }, ].filter(Boolean) };
                            result = { success: true, data: formattedResult };
                        } catch (e) {
                            result = { success: false, error: e instanceof Error ? e.message : 'Erro de cálculo.' };
                        }
                    } else {
                        result = { error: 'Função desconhecida.' };
                    }
                    functionResponses.push({
                        name: fc.name,
                        response: { result }
                    });
                }

                const history = [
                    { role: 'user', parts: [{ text: message }] },
                    { role: 'model', parts: functionCalls.map(fc => ({ functionCall: fc })) }
                ];
                
                const functionResponseParts = functionResponses.map(fr => ({
                    functionResponse: { name: fr.name, response: fr.response }
                }));

                const secondResponse = await ai.models.generateContent({
                    model,
                    contents: [...history, { role: 'user', parts: functionResponseParts }],
                    config: { systemInstruction: getSystemInstruction() }
                });
                assistantText = secondResponse.text;
            }

            const groundingMetadata = genaiResponse.candidates?.[0]?.groundingMetadata;
            if (groundingMetadata?.groundingChunks) {
                resourceLinks = groundingMetadata.groundingChunks
                    .map((chunk: any) => (chunk.web) ? ({ uri: chunk.web.uri, title: chunk.web.title || 'Fonte' }) : null)
                    .filter(Boolean);
            }
    
            const assistantMessage: Transcription = {
                id: uuidv4(),
                speaker: 'assistant',
                text: assistantText,
                timestamp: Date.now(),
                resourceLinks: resourceLinks.length > 0 ? resourceLinks : undefined,
            };
            setTranscriptions(prev => [...prev, assistantMessage]);
    
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage: Transcription = {
                id: uuidv4(),
                speaker: 'system',
                text: `Ocorreu um erro: ${error instanceof Error ? error.message : String(error)}`,
                timestamp: Date.now(),
            };
            setTranscriptions(prev => [...prev, errorMessage]);
        } finally {
            setConnectionState(ConnectionState.IDLE);
        }
    }, [
        getActiveApiKey,
        imagePreviewUrl,
        getSystemInstruction,
        getTools,
        productCatalog
    ]);
    
    const onEnterCoCreatorMode = (docId: string) => {
        const doc = appState.documents.find(d => d.id === docId);
        if (doc) {
            setActiveDocumentId(doc.id);
            setInteractionMode('cocreator');
        } else {
            console.error("Documento não encontrado para o modo co-criador");
        }
    };

    const togglePanel = (panel: string) => {
        const isSpreadsheetPanel = panel === 'spreadsheet';
        const isOpeningSpreadsheet = isSpreadsheetPanel && !activePanels.spreadsheet;
        const isSessionActive = [ConnectionState.CONNECTED, ConnectionState.SPEAKING, ConnectionState.THINKING, ConnectionState.CONNECTING].includes(liveConnectionState);

        if (isOpeningSpreadsheet) {
            setInteractionMode('live');
        }

        if (isSpreadsheetPanel && isSessionActive) {
            stopConversation();
            restartConversationAfterContextSwitch.current = true;
        }

        setActivePanels(prev => ({ ...prev, [panel]: !prev[panel] }));
    };

    const handleSettingsChange = (newSettings: AssistantSettings) => {
        setAppState(prev => ({ ...prev, settings: newSettings }));
    };
    
    const validateReplicateApiKey = useCallback(async (key: string | null) => {
        if (!key) {
            setReplicateApiStatus('idle');
            return;
        }
        setReplicateApiStatus('checking');
        try {
            const response = await fetch(`${CORS_PROXY_URL}https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro`, {
                headers: { 'Authorization': `Bearer ${key}` }
            });
            if (response.ok) {
                setReplicateApiStatus('valid');
            } else {
                setReplicateApiStatus('invalid');
            }
        } catch (error) {
            console.error('Replicate API validation failed:', error);
            setReplicateApiStatus('invalid');
        }
    }, []);

    const handleReplicateApiKeyChange = (newKey: string) => {
        handleSettingsChange({ ...appState.settings, replicateApiKey: newKey });
        validateReplicateApiKey(newKey);
    };

    useEffect(() => {
        validateReplicateApiKey(appState.settings.replicateApiKey);
    }, [appState.settings.replicateApiKey, validateReplicateApiKey]);

    const fetchWebApi = useCallback(async (endpoint: string, method: 'GET' | 'POST', body?: any) => {
        const token = appState.settings.spotifyToken;
        if (!token) {
            throw new Error('Token do Spotify não configurado.');
        }
        const res = await fetch(`https://api.spotify.com/${endpoint}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            method,
            body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error?.message || `Spotify API Error: ${res.statusText}`);
        }
        if (res.status === 201 || res.status === 204) {
             return res.status === 201 ? await res.json() : true;
        }
        return await res.json();
    }, [appState.settings.spotifyToken]);

    const validateSpotifyToken = useCallback(async (token: string | null) => {
        if (!token) {
            setSpotifyTokenStatus('idle');
            return;
        }
        setSpotifyTokenStatus('checking');
        try {
            await fetchWebApi('v1/me', 'GET');
            setSpotifyTokenStatus('valid');
        } catch (error) {
            console.error('Validação do token do Spotify falhou:', error);
            setSpotifyTokenStatus('invalid');
        }
    }, [fetchWebApi]);

    useEffect(() => {
        validateSpotifyToken(appState.settings.spotifyToken);
    }, [appState.settings.spotifyToken, validateSpotifyToken]);

    const handleSpotifyTokenChange = (newToken: string) => {
        handleSettingsChange({ ...appState.settings, spotifyToken: newToken });
        validateSpotifyToken(newToken);
    };

    const fetchTopTracks = useCallback(async () => {
        setSpotifyState(prev => ({ ...prev, isLoading: true, error: null, statusMessage: 'Buscando suas músicas mais tocadas...' }));
        try {
            const result = await fetchWebApi('v1/me/top/tracks?time_range=long_term&limit=5', 'GET');
            setSpotifyState(prev => ({ ...prev, isLoading: false, topTracks: result.items, statusMessage: 'Top 5 músicas carregadas!' }));
        } catch (error: any) {
            setSpotifyState(prev => ({ ...prev, isLoading: false, error: error.message, statusMessage: 'Falha ao buscar músicas.' }));
        }
    }, [fetchWebApi]);

    const createSpotifyPlaylist = useCallback(async () => {
        if (spotifyState.topTracks.length === 0) return;
        setSpotifyState(prev => ({ ...prev, isLoading: true, error: null, statusMessage: 'Criando sua playlist...' }));

        try {
            const { id: user_id } = await fetchWebApi('v1/me', 'GET');
            
            const playlist = await fetchWebApi(`v1/users/${user_id}/playlists`, 'POST', {
                "name": "Meu Top 5 Músicas (Gerado por IA)",
                "description": "Playlist com suas músicas mais tocadas, criada pelo Assistente Neural.",
                "public": false
            });

            setSpotifyState(prev => ({ ...prev, statusMessage: 'Adicionando músicas à playlist...' }));

            const tracksUri = spotifyState.topTracks.map(track => track.uri);
            await fetchWebApi(`v1/playlists/${playlist.id}/tracks?uris=${tracksUri.join(',')}`, 'POST');

            setSpotifyState(prev => ({ ...prev, isLoading: false, createdPlaylistId: playlist.id, statusMessage: 'Playlist criada com sucesso!' }));

        } catch (error: any) {
            setSpotifyState(prev => ({ ...prev, isLoading: false, error: error.message, statusMessage: 'Falha ao criar a playlist.' }));
        }
    }, [fetchWebApi, spotifyState.topTracks]);
    
    const validateSerpApiKey = useCallback(async (key: string | null) => {
        if (!key) {
            setSerpApiStatus('idle');
            return;
        }
        setSerpApiStatus('checking');
        try {
            const response = await fetch(`${CORS_PROXY_URL}https://serpapi.com/locations.json?api_key=${key}`);
             if (response.ok) {
                setSerpApiStatus('valid');
             } else {
                 const errorBody = await response.json();
                 if (errorBody?.error?.includes("invalid API key")) {
                    setSerpApiStatus('invalid');
                 } else {
                    setSerpApiStatus('valid'); 
                 }
            }
        } catch (error) {
            console.error('SERP API validation failed:', error);
            setSerpApiStatus('invalid');
        }
    }, []);

    const handleSerpApiKeyChange = (newKey: string) => {
        handleSettingsChange({ ...appState.settings, serpApiKey: newKey });
        validateSerpApiKey(newKey);
    };

    useEffect(() => {
        validateSerpApiKey(appState.settings.serpApiKey);
    }, [appState.settings.serpApiKey, validateSerpApiKey]);

    // Fix: Define the 'onPerformSerpSearch' function to resolve the "Cannot find name" error.
    const onPerformSerpSearch = useCallback(async (query: string) => {
        const serpApiKey = appState.settings.serpApiKey;
        const geminiApiKey = getActiveApiKey();
    
        if (!serpApiKey || !geminiApiKey) {
            setSerpApiState(prev => ({ ...prev, isLoading: false, error: 'Chave da SERP API ou da Google AI não configurada.' }));
            return;
        }
    
        setSerpApiState({ isLoading: true, error: null, query, cardResult: null, magazineResult: null });
        
        const engines = ['google', 'google_scholar', 'youtube', 'google_news'];
        setAppState(prev => ({ ...prev, settings: { ...prev.settings, serpApiRequestCount: prev.settings.serpApiRequestCount + engines.length } }));
    
        try {
            const searchPromises = engines.map(engine => 
                fetch(`${CORS_PROXY_URL}https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${serpApiKey}&engine=${engine}`)
                    .then(res => res.ok ? res.json() : Promise.reject(`SERP API (${engine}) Error: ${res.statusText}`))
                    .then(data => ({ engine, data }))
            );
    
            const results = await Promise.allSettled(searchPromises);
    
            const curatedResults: any = {};
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    const { engine, data } = result.value;
                    if (engine === 'google' && data.organic_results) curatedResults.organic_results = data.organic_results.slice(0, 10).map((r: any) => ({ title: r.title, link: r.link, snippet: r.snippet }));
                    if (engine === 'google_scholar' && data.organic_results) curatedResults.scholar_articles = data.organic_results.slice(0, 5).map((r: any) => ({ title: r.title, link: r.link, publication_info: r.publication_info?.summary, snippet: r.snippet }));
                    if (engine === 'youtube' && data.video_results) curatedResults.youtube_videos = data.video_results.slice(0, 5).map((r: any) => ({ title: r.title, link: r.link, channel: r.channel?.name, published_date: r.published_date }));
                    if (engine === 'google_news' && data.news_results) curatedResults.news_articles = data.news_results.slice(0, 5).map((r: any) => ({ title: r.title, link: r.link, source: r.source, date: r.date, snippet: r.snippet }));
                }
            });
    
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            
            const prompt = `
                Com base nos seguintes resultados de pesquisa de múltiplas fontes para a consulta "${query}", crie um cartão de resultado abrangente e bem organizado.

                REGRAS:
                1. Crie um título claro e direto para o cartão que resuma o tópico da pesquisa.
                2. Escreva um resumo informativo e denso, sintetizando os insights mais importantes de TODAS as fontes (resultados orgânicos, acadêmicos, vídeos e notícias).
                3. Selecione os 10 recursos mais importantes e diversos de todas as fontes. Para cada recurso, forneça um título claro e o URI. Priorize a diversidade de fontes (artigos, vídeos, notícias, etc.).

                DADOS DA PESQUISA:
                ${JSON.stringify(curatedResults)}

                Sua saída DEVE ser um objeto JSON válido que corresponda estritamente ao esquema fornecido. Não inclua texto ou explicações fora do objeto JSON.
            `;
    
            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "Um título abrangente para a consulta de pesquisa." },
                    summary: { type: Type.STRING, description: "Um resumo denso sintetizando todas as fontes." },
                    resources: {
                        type: Type.ARRAY,
                        description: "Os 10 recursos mais relevantes de todas as fontes.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                uri: { type: Type.STRING, description: "O URL do recurso." },
                            },
                            required: ['title', 'uri']
                        }
                    }
                },
                required: ['title', 'summary', 'resources']
            };
    
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema
                }
            });
            
            const resultJson = JSON.parse(sanitizeJsonResponse(response.text)) as SerpCardResult;
            
            setSerpApiState(prev => ({ ...prev, isLoading: false, cardResult: resultJson }));

        } catch (error: any) {
            console.error("SERP API search failed:", error);
            setSerpApiState(prev => ({ ...prev, isLoading: false, error: `Erro na busca profunda: ${error.message}` }));
        }
    }, [appState.settings.serpApiKey, getActiveApiKey, setAppState]);

    const onPlayPauseTTS = (id?: string) => {
        const targetId = id || ttsState.playingId;
        if (!targetId) return;

        if (ttsState.playingId === targetId) {
            if (ttsState.isPaused) resumeTTS();
            else pauseTTS();
        } else {
            const allTranscriptions = [...transcriptions, ...appState.magazine];
            const transcriptionToPlay = allTranscriptions.find(t => t.id === targetId);
            if (transcriptionToPlay) {
                let textToSpeak = transcriptionToPlay.text;
                if (transcriptionToPlay.reportContent) {
                    const report = transcriptionToPlay.reportContent;
                    const sectionsText = report.sections.map(s => `${s.heading}. ${s.content}`).join('\n\n');
                    textToSpeak = `${report.title}. ${report.summary}. ${sectionsText}`;
                }
                playTTS(cleanTextForTTS(textToSpeak), targetId, true);
            }
        }
    };
    
    const onSetImageGenerationMode = (mode: 'generate' | 'edit') => {
        setImageGenerationState(prev => ({ ...prev, mode, imageToEdit: mode === 'generate' ? null : prev.imageToEdit, error: null }));
    };

    const onSelectImageToEdit = (image: ImageGeneration | null) => {
        setImageGenerationState(prev => ({
            ...prev,
            mode: image ? 'edit' : 'generate',
            imageToEdit: image,
            error: null,
        }));
    };

    const urlToDataUri = async (url: string): Promise<string> => {
        const response = await fetch(`${CORS_PROXY_URL}${url}`);
        if (!response.ok) {
            throw new Error(`Falha ao buscar imagem para edição: ${response.statusText}`);
        }
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const onEditImage = useCallback(async (prompt: string) => {
        const REPLICATE_API_TOKEN = appState.settings.replicateApiKey;
        if (!REPLICATE_API_TOKEN) {
            setImageGenerationState(prev => ({ ...prev, error: "Chave da API do Replicate não configurada nas Configurações." }));
            return;
        }
    
        if (!imageGenerationState.imageToEdit) {
            setImageGenerationState(prev => ({ ...prev, error: "Nenhuma imagem selecionada para editar." }));
            return;
        }
    
        setImageGenerationState(prev => ({ ...prev, isLoading: true, error: null }));
    
        try {
            const imageUrl = imageGenerationState.imageToEdit.imageUrl;
            const imageDataUri = imageUrl.startsWith('data:') ? imageUrl : await urlToDataUri(imageUrl);

            const createResponse = await fetch(`${CORS_PROXY_URL}https://api.replicate.com/v1/predictions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "version": "c1f78818f3e583151950d2681557d9045763595f4e153e36e4f323a6331e840a",
                    "input": { prompt, image: imageDataUri }
                })
            });
    
            if (!createResponse.ok) {
                const errorBody = await createResponse.json();
                throw new Error(errorBody.detail || `Falha ao criar predição de edição: ${createResponse.statusText}`);
            }
    
            let prediction = await createResponse.json();
    
            while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                const getResponse = await fetch(`${CORS_PROXY_URL}https://api.replicate.com/v1/predictions/${prediction.id}`, {
                    headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` }
                });
                if (!getResponse.ok) {
                    const errorBody = await getResponse.json();
                    throw new Error(errorBody.detail || `Falha ao obter o status da predição: ${getResponse.statusText}`);
                }
                prediction = await getResponse.json();
            }
    
            if (prediction.status === 'failed') {
                throw new Error(`A edição da imagem falhou: ${prediction.error}`);
            }
    
            const newImageUrl = prediction.output[0];
            const newGeneration: ImageGeneration = {
                id: uuidv4(),
                prompt,
                imageUrl: newImageUrl,
                aspectRatio: imageGenerationState.imageToEdit!.aspectRatio,
                createdAt: new Date().toISOString()
            };
            setImageGenerationState(prev => ({
                ...prev,
                generations: [newGeneration, ...prev.generations],
                mode: 'generate',
                imageToEdit: null,
            }));
    
        } catch (error: any) {
            console.error('Erro na edição de imagem:', error);
            setImageGenerationState(prev => ({ ...prev, error: error.message }));
        } finally {
            setImageGenerationState(prev => ({ ...prev, isLoading: false }));
        }
    }, [imageGenerationState.imageToEdit, appState.settings.replicateApiKey]);
    
    const onGenerateImage = useCallback(async (prompt: string, aspectRatio: string) => {
        const REPLICATE_API_TOKEN = appState.settings.replicateApiKey;
        if (!REPLICATE_API_TOKEN) {
            setImageGenerationState(prev => ({ ...prev, error: "Chave da API do Replicate não configurada nas Configurações." }));
            return;
        }
    
        setImageGenerationState(prev => ({ ...prev, isLoading: true, error: null }));
    
        try {
            const createResponse = await fetch(`${CORS_PROXY_URL}https://api.replicate.com/v1/predictions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "version": "f77983347a61476b36d0774a3501a4099955776d52f9547d7b0f69a35e69e48f",
                    "input": {
                        prompt: prompt,
                        aspect_ratio: aspectRatio,
                        output_format: "webp",
                        output_quality: 90,
                    }
                })
            });
    
            if (!createResponse.ok) {
                const errorBody = await createResponse.json();
                throw new Error(errorBody.detail || `Falha ao criar predição: ${createResponse.statusText}`);
            }
    
            let prediction = await createResponse.json();
    
            while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const getResponse = await fetch(`${CORS_PROXY_URL}https://api.replicate.com/v1/predictions/${prediction.id}`, {
                    headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` }
                });
                
                if (!getResponse.ok) {
                    const errorBody = await getResponse.json();
                    throw new Error(errorBody.detail || `Falha ao obter o status da predição: ${getResponse.statusText}`);
                }
                
                prediction = await getResponse.json();
            }
    
            if (prediction.status === 'failed') {
                throw new Error(`A geração da imagem falhou: ${prediction.error}`);
            }
    
            const imageUrl = prediction.output[0];
            const newGeneration: ImageGeneration = {
                id: uuidv4(),
                prompt,
                imageUrl,
                aspectRatio,
                createdAt: new Date().toISOString()
            };
            setImageGenerationState(prev => ({
                ...prev,
                generations: [newGeneration, ...prev.generations]
            }));
    
        } catch (error: any) {
            console.error('Erro na geração de imagem:', error);
            setImageGenerationState(prev => ({ ...prev, error: error.message }));
        } finally {
            setImageGenerationState(prev => ({ ...prev, isLoading: false }));
        }
    }, [appState.settings.replicateApiKey]);

    const interruptAssistant = () => {
        stopConversation();
        stopTTS();
        setConnectionState(ConnectionState.IDLE);
    };

    const toggleWebSearch = () => setIsWebSearchForced(prev => !prev);
    
    const onStartNewConversation = async () => {
        if (transcriptions.length === 0 && liveModeTranscriptions.length === 0) {
            chatRef.current = null;
            return;
        }
    
        const currentTranscriptions = interactionMode === 'live' ? liveModeTranscriptions : transcriptions;
    
        const apiKey = getActiveApiKey();
        if (!apiKey) {
            console.error("Não é possível salvar a sessão de chat sem uma chave de API.");
            setTranscriptions([]);
            setLiveModeTranscriptions([]);
            chatRef.current = null;
            return;
        }
    
        setConnectionState(ConnectionState.SAVING);
        try {
            const ai = new GoogleGenAI({ apiKey });
            const conversationText = currentTranscriptions.map(t => `${t.speaker}: ${t.text}`).join('\n\n');
    
            const prompt = `
                Com base na transcrição da conversa a seguir, gere um título conciso, um resumo de um parágrafo e até 5 tags relevantes.
    
                CONVERSA:
                ---
                ${conversationText}
                ---
    
                Sua resposta DEVE ser um objeto JSON válido com a seguinte estrutura:
                {
                  "title": "Um título curto e descritivo para a conversa.",
                  "summary": "Um único parágrafo resumindo os pontos-chave da conversa.",
                  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
                }
            `;
    
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            summary: { type: Type.STRING },
                            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ['title', 'summary', 'tags'],
                    }
                }
            });
    
            const result = JSON.parse(sanitizeJsonResponse(response.text));
    
            const newSession: ChatSession = {
                id: uuidv4(),
                title: result.title,
                summary: result.summary,
                tags: result.tags,
                timestamp: new Date().toISOString(),
                transcriptions: [...currentTranscriptions]
            };
    
            setAppState(prev => ({
                ...prev,
                chatHistory: [newSession, ...prev.chatHistory]
            }));
    
        } catch (error) {
            console.error("Falha ao gerar resumo do chat e salvar sessão:", error);
            const fallbackSession: ChatSession = {
                id: uuidv4(),
                title: `Chat de ${new Date().toLocaleString('pt-BR')}`,
                summary: 'Não foi possível gerar um resumo para esta sessão.',
                tags: ['sem-resumo'],
                timestamp: new Date().toISOString(),
                transcriptions: [...currentTranscriptions]
            };
             setAppState(prev => ({
                ...prev,
                chatHistory: [fallbackSession, ...prev.chatHistory]
            }));
        } finally {
            setTranscriptions([]);
            setLiveModeTranscriptions([]);
            chatRef.current = null;
            setConnectionState(ConnectionState.IDLE);
        }
    };
    
    const onImageSelected = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result?.toString().split(',')[1];
            if (base64String) {
                imageBase64Ref.current = base64String;
                setImagePreviewUrl(URL.createObjectURL(file));
            }
        };
        reader.readAsDataURL(file);
    };

    const onClearImage = () => {
        setImagePreviewUrl(null);
        imageBase64Ref.current = null;
    };
    const onPlayVideo = (url: string) => setMediaPlayerUrl(url);
    const closeMediaPlayer = () => setMediaPlayerUrl(null);
    const onLoadLocalContext = (link: LocalContextLink) => console.log('Load local context:', link);
    const onAddVideoToLibrary = (resource: ResourceLink) => {
        const newVideo: Video = { id: uuidv4(), videoUrl: resource.uri, title: resource.title, thumbnailUrl: resource.thumbnailUrl || '', summary: 'Analisando...', tags: [], isProcessing: true };
        setAppState(prev => ({ ...prev, videos: [...prev.videos, newVideo] }));
        setTimeout(() => {
            setAppState(prev => ({
                ...prev,
                videos: prev.videos.map(v => v.id === newVideo.id ? { ...v, summary: `Resumo do vídeo sobre ${v.title}.`, tags: ['tag1', 'tag2'], isProcessing: false } : v)
            }));
        }, 3000);
    };
    // Fix: Create a wrapper function to adapt the `onAddVideoToLibrary` (which takes a `ResourceLink`) to the `onAddVideoByUrl` prop (which expects a `string`).
    const onAddVideoByUrl = (url: string) => {
        const resource: ResourceLink = {
            uri: url,
            title: url,
            summary: 'A ser adicionado...',
            thumbnailUrl: getThumbnailUrl(url) || '',
        };
        onAddVideoToLibrary(resource);
    };
    const onAddResourceToArchive = (resource: ResourceLink) => {
      setAppState(prev => ({
        ...prev,
        archivedLinks: [
          ...prev.archivedLinks.filter(l => !l.prefillUrl), // Remove any existing prefill
          { prefillUrl: JSON.stringify(resource) } as any
        ]
      }));
      togglePanel('literaryArchive');
    };
    const clearVideoSearchResults = () => setVideoSearchResults([]);
    const onIngestUrl = (url: string) => {
      onAddResourceToArchive({uri: url, title: url, summary: "A ser analisado..."});
    };
    const onLoadDocumentToEditor = (docId: string) => { 
        setActiveDocumentId(docId);
        togglePanel('documentEditor'); 
    };
    const onDismissInfoCard = (id: string) => setInformationCards(prev => prev.filter(c => c.id !== id));
    const onDismissReminder = (reminderId: string) => {
        setActiveReminders(prev => prev.filter(r => r.id !== reminderId));
    };
    const onOpenDeepDive = useCallback((resources: MagazineResource[]) => {
        setDeepDiveResources(resources);
    }, []);
    const onCloseDeepDive = useCallback(() => {
        setDeepDiveResources(null);
    }, []);
    const onAnalyzeFile = (file: File) => console.log('Analyze file:', file);
    const handleAnalysisAction = (action: string) => console.log('Analysis action:', action);
    const onPerformGroundedSearch = (query: string) => {
        setGroundedSearchState({isLoading: true, error: null, result: null });
        setTimeout(() => {
            setGroundedSearchState({
                isLoading: false,
                error: null,
                result: {
                    summary: `Esta é uma resposta simulada para a busca: "${query}".`,
                    sources: [{ title: 'Fonte 1', uri: 'https://example.com' }]
                }
            })
        }, 2000);
    };
    const onLoadContacts = () => console.log('Load contacts');


    const onSearchAndAddPodcast = useCallback(async (query: string) => {
        setAppState(prev => ({ ...prev, podcastState: { ...prev.podcastState, isLoading: true, error: null } }));
        await new Promise(res => setTimeout(res, 1500));
        
        const queryLower = query.toLowerCase();
        const foundPodcast = mockPodcasts.find(p => p.show.title.toLowerCase().includes(queryLower));

        if (foundPodcast) {
             setAppState(prev => {
                const alreadyExists = prev.podcastState.shows.some(s => s.id === foundPodcast.show.id);
                if (alreadyExists) {
                    return { ...prev, podcastState: { ...prev.podcastState, isLoading: false, error: "Este podcast já está na sua biblioteca." }};
                }
                
                const newShows = [...prev.podcastState.shows, foundPodcast.show];
                const newEpisodes = { ...prev.podcastState.episodes, [foundPodcast.show.id]: foundPodcast.episodes };
                
                return { ...prev, podcastState: { ...prev.podcastState, shows: newShows, episodes: newEpisodes, isLoading: false, error: null }};
            });
        } else {
            setAppState(prev => ({ ...prev, podcastState: { ...prev.podcastState, isLoading: false, error: `Nenhum podcast encontrado para "${query}".` } }));
        }
    }, [setAppState]);

    const onAddPodcastByUrl = useCallback(async (url: string) => {}, []);

    const onPlayEpisode = useCallback((showId: string, episodeId: string) => {
        setAppState(prev => ({
            ...prev,
            podcastState: {
                ...prev.podcastState,
                nowPlaying: { showId, episodeId },
                playerStatus: 'playing',
            }
        }));
    }, [setAppState]);

    const onPlayerAction = useCallback((action: 'play' | 'pause' | 'stop') => {
        setAppState(prev => {
             if (action === 'play' && prev.podcastState.nowPlaying) {
                 return { ...prev, podcastState: { ...prev.podcastState, playerStatus: 'playing' } };
             }
             if (action === 'pause' && prev.podcastState.nowPlaying) {
                 return { ...prev, podcastState: { ...prev.podcastState, playerStatus: 'paused' } };
             }
             if (action === 'stop') {
                 return { ...prev, podcastState: { ...prev.podcastState, playerStatus: 'stopped' } };
             }
             return prev;
        });
    }, [setAppState]);

    const onUpdateEpisodeState = useCallback((episodeId: string, state: { playbackPosition?: number; listened?: boolean }) => {
        setAppState(prev => {
            const currentEpisodeState = prev.podcastState.episodeStates[episodeId] || { playbackPosition: 0, listened: false };
            return {
                ...prev,
                podcastState: {
                    ...prev.podcastState,
                    episodeStates: {
                        ...prev.podcastState.episodeStates,
                        [episodeId]: {
                            ...currentEpisodeState,
                            ...state,
                        }
                    }
                }
            }
        });
    }, [setAppState]);

    const onAddToQueue = useCallback((episodeId: string) => {
        setAppState(prev => ({
            ...prev,
            podcastState: {
                ...prev.podcastState,
                playbackQueue: [...prev.podcastState.playbackQueue.filter(id => id !== episodeId), episodeId],
            }
        }));
    }, [setAppState]);

    const onPlayNextInQueue = useCallback(() => {
        setAppState(prev => {
            const { playbackQueue, episodes } = prev.podcastState;
            if (playbackQueue.length === 0) {
                return { ...prev, podcastState: { ...prev.podcastState, playerStatus: 'stopped', nowPlaying: null } };
            }
            const nextEpisodeId = playbackQueue[0];
            const remainingQueue = playbackQueue.slice(1);
            
            let showId: string | null = null;
            for (const sId in episodes) {
                if (episodes[sId].some(e => e.id === nextEpisodeId)) {
                    showId = sId;
                    break;
                }
            }
            
            if (showId) {
                return { ...prev, podcastState: { ...prev.podcastState, playbackQueue: remainingQueue, nowPlaying: { showId, episodeId: nextEpisodeId }, playerStatus: 'playing' } };
            }

            return { ...prev, podcastState: { ...prev.podcastState, playbackQueue: [], playerStatus: 'stopped', nowPlaying: null } };
        });
    }, [setAppState]);

    const podcastPanelProps = {
        isOpen: !!activePanels.podcast,
        onClose: () => togglePanel('podcast'),
        podcastState: appState.podcastState,
        onSearchAndAddPodcast,
        onAddPodcastByUrl,
        onPlayEpisode,
        onPlayerAction,
        onUpdateEpisodeState,
        onAddToQueue,
        onPlayNextInQueue,
    };
    
    // Fix: Pass the actual `refreshRssFeeds` function to the `onRefresh` prop, fulfilling the component's requirement.
    const rssPanelProps = { articles: rssArticles, isLoading: isRssLoading, error: rssError, onRefresh: refreshRssFeeds, isOpen: !!activePanels.rss, onClose: () => togglePanel('rss'), selectedVoiceName: appState.settings.selectedBrowserVoice, speechRate: appState.settings.speechRate };
    const settingsPanelProps = { settings: appState.settings, onSettingsChange: handleSettingsChange, onReplicateApiKeyChange: handleReplicateApiKeyChange, replicateApiStatus: replicateApiStatus, onSpotifyTokenChange: handleSpotifyTokenChange, spotifyTokenStatus: spotifyTokenStatus, onSerpApiKeyChange: handleSerpApiKeyChange, serpApiStatus, onTomTomApiKeyChange: (key: string) => handleSettingsChange({ ...appState.settings, tomTomApiKey: key }), onOpenAboutModal: () => {}, isOpen: !!activePanels.settings, onClose: () => togglePanel('settings'), promptCartridges: [], activeCartridgeId: null, onAddPromptCartridge: () => {}, onDeletePromptCartridge: () => {}, onSetActivePromptCartridge: () => {}, apiKeys: appState.apiKeys, activeApiKeyId: appState.settings.activeApiKeyId, onAddApiKey: (key: { name: string; value: string }) => setAppState(prev => ({...prev, apiKeys: [...prev.apiKeys, { ...key, id: uuidv4() }]})), onDeleteApiKey: (id: string) => setAppState(prev => ({...prev, apiKeys: prev.apiKeys.filter(k => k.id !== id)})), onSetActiveApiKey: (id: string) => setAppState(prev => ({...prev, settings: {...prev.settings, activeApiKeyId: id }})) };
    const userProfilePanelProps = { isOpen: !!activePanels.userProfile, onClose: () => togglePanel('userProfile'), profileData: appState.userProfileData, isLoading: false, onUpdateProfile: () => {} };
    const chatHistoryPanelProps = { isOpen: !!activePanels.history, onClose: () => togglePanel('history'), history: appState.chatHistory, onSelectChat: () => {}, activeChatId: null, onDeleteChat: () => {}, onClearHistory: () => {} };
    const calendarPanelProps = { isOpen: !!activePanels.calendar, onClose: () => togglePanel('calendar'), events: appState.calendarEvents, onScheduleEvent, onEditEvent, onDeleteEvent, onUpdateEventStatus };
    const documentLibraryPanelProps = { isOpen: !!activePanels.documentLibrary, onClose: () => togglePanel('documentLibrary'), documents: [], onLoadDocument: () => {}, onCreateNewDocument: () => {}, onDeleteDocument: () => {}, onUpdateDocumentTags: () => {} };
    const documentEditorPanelProps = { isOpen: !!activePanels.documentEditor, onClose: () => { if (interactionMode === 'cocreator') { setInteractionMode('chat'); stopConversation(); } togglePanel('documentEditor'); }, activeDocument: appState.documents.find(d => d.id === activeDocumentId) || null, onSetDocumentContent: (content: string) => activeDocumentId && onSetDocumentContent(activeDocumentId, content), onEnterCoCreatorMode: onEnterCoCreatorMode };
    const synthesisHubPanelProps = { state: appState.synthesisHub, onClose: () => togglePanel('synthesisHub'), documents: [], videos: [], onToggleSource: () => {}, onSynthesize: () => {}, onClear: () => {} };
    // Fix: Pass the newly created `onAddVideoByUrl` function to satisfy the expected `(url: string) => void` type.
    const videotecaPanelProps = { isOpen: !!activePanels.videoteca, onClose: () => togglePanel('videoteca'), videos: appState.videos, onAddVideoByUrl: onAddVideoByUrl, onDeleteVideo: (id: string) => setAppState(prev => ({...prev, videos: prev.videos.filter(v => v.id !== id)})), isProcessing: isIngesting };
    const literaryArchivePanelProps = { isOpen: !!activePanels.literaryArchive, onClose: () => togglePanel('literaryArchive'), library: appState.archivedLinks, onAddLink: (link: Omit<ArchivedLink, 'id'>) => setAppState(prev => ({...prev, archivedLinks: [...prev.archivedLinks.filter(l => !l.prefillUrl), {...link, id: uuidv4()}]})), onUpdateLink: (id: string, updates: Partial<ArchivedLink>) => setAppState(prev => ({...prev, archivedLinks: prev.archivedLinks.map(l => l.id === id ? {...l, ...updates} : l)})), onDeleteLink: (id: string) => setAppState(prev => ({...prev, archivedLinks: prev.archivedLinks.filter(l => l.id !== id)})), onGenerateDescription: async () => 'Generated description', prefillUrl: appState.archivedLinks.find(l => l.prefillUrl)?.prefillUrl ? JSON.parse(appState.archivedLinks.find(l => l.prefillUrl)!.prefillUrl!) : null, onClearPrefill: () => setAppState(prev => ({...prev, archivedLinks: prev.archivedLinks.filter(l => !l.prefillUrl)})) };
    const postItPanelProps = { isOpen: !!activePanels.postIt, onClose: () => togglePanel('postIt'), notes: appState.postItNotes, onAddNote: onAddPostItNote, onUpdateNote: onUpdatePostItNote, onDeleteNote: onDeletePostItNote, onProcessText: onProcessPostItText, onPlayTTS: onPlayPostItTTS, onStopTTS: stopTTS, ttsState: ttsState };
    const imageGenerationPanelProps = { isOpen: !!activePanels.imageGeneration, onClose: () => togglePanel('imageGeneration'), state: imageGenerationState, onGenerateImage, onEditImage, onSetMode: onSetImageGenerationMode, onSelectImageToEdit };
    const spotifyPanelProps = { isOpen: !!activePanels.spotify, onClose: () => togglePanel('spotify'), state: spotifyState, tokenStatus: spotifyTokenStatus, onFetchTopTracks: fetchTopTracks, onCreatePlaylist: createSpotifyPlaylist };
    const serpApiPanelProps = { isOpen: !!activePanels.serpApi, onClose: () => togglePanel('serpApi'), state: serpApiState, serpApiStatus, onPerformSearch: onPerformSerpSearch, onOpenSettings: () => togglePanel('settings') };
    const tomTomMapPanelProps = { isOpen: !!activePanels.tomTomMap, onClose: () => togglePanel('tomTomMap'), apiKey: appState.settings.tomTomApiKey };
    const picassoPanelProps = { isOpen: !!activePanels.picasso, onClose: () => togglePanel('picasso'), state: appState.pollinationsState, onGenerateImage: () => {}, onDeleteImage: () => {}, onReusePrompt: () => {} };
    const spreadsheetPanelProps = { 
        isOpen: !!activePanels.spreadsheet, 
        onClose: () => togglePanel('spreadsheet'),
        spreadsheetState: appState.spreadsheetState,
        onFileChange: () => {}, 
        onDownload: () => {}, 
        onEject: () => {}, 
        toggleConversationMode, 
        connectionState,
        isLoading: isSpreadsheetLoading,
        error: spreadsheetError,
        onUndo: () => {},
        onRevertToVersion: () => {},
        onCommandFeedback: () => {}
    };

    return {
        isDbActive,
        dbStatus,
        initializePersistence,
        persistenceMode,
        transcriptions,
        connectionState,
        interactionMode,
        setInteractionMode,
        toggleConversationMode,
        interruptAssistant,
        ttsState,
        onPlayPauseTTS,
        onStopTTS: stopTTS,
        volume: appState.settings.volume,
        onVolumeChange,
        recordingState,
        startRecording,
        stopRecording,
        elapsedTime,
        transcriptionProgress,
        textInput,
        setTextInput,
        onSendMessage,
        activeSearchContexts,
        onToggleSearchContext: (ctx: string) => setActiveSearchContexts(prev => {
            const next = new Set(prev);
            if (next.has(ctx)) next.delete(ctx);
            else next.add(ctx);
            return next;
        }),
        dynamicSearchContexts,
        isWebSearchForced,
        toggleWebSearch,
        onStartNewConversation,
        onImageSelected,
        imagePreviewUrl,
        onClearImage,
        videoSearchResults,
        clearVideoSearchResults,
        onPlayVideo,
        mediaPlayerUrl,
        closeMediaPlayer,
        videos: appState.videos,
        onLoadLocalContext,
        onAddVideoToLibrary,
        onAddResourceToArchive,
        informationCards,
        onDismissInfoCard,
        activeReminders,
        onDismissReminder,
        deepAnalysisState,
        onAnalyzeFile,
        handleAnalysisAction,
        groundedSearchState,
        onPerformGroundedSearch,
        onLoadContacts,
        liveTranscript,
        liveModeTranscriptions,
        coCreatorSpecialization,
        setCoCreatorSpecialization,
        togglePanel,
        activePanels,
        settingsPanelProps,
        userProfilePanelProps,
        chatHistoryPanelProps,
        calendarPanelProps,
        rssPanelProps,
        documentLibraryPanelProps,
        documentEditorPanelProps,
        synthesisHubPanelProps,
        videotecaPanelProps,
        literaryArchivePanelProps,
        postItPanelProps,
        imageGenerationPanelProps,
        spotifyPanelProps,
        serpApiPanelProps,
        podcastPanelProps,
        tomTomMapPanelProps,
        picassoPanelProps,
        spreadsheetPanelProps,
        apiKeys: appState.apiKeys,
        deepDiveResources,
        onOpenDeepDive,
        onCloseDeepDive,
        getActiveApiKey,
        handleFilesSelect, 
        // Fix: Correctly return the 'processingQueue' state variable.
        processingQueue: processingQueue, 
        cancelBatchProcessing,
        onCopyToClipboard,
        onCopyTagsToClipboard,
        onSaveToMagazine,
        justCopiedId,
        justCopiedTagsId,
        justSavedIds,
        creativeSlate: appState.creativeSlate,
        onDeleteSlateCard,
        onCopySlateCardContent,
        isProcessingPersonality,
        processWhiteboardForPersonality,
        personalityFrameworkData: appState.personalityFrameworkData,
        magazine: appState.magazine,
        productCatalog
    };
};

export default useNeuralAssistant;
