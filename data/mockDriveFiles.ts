import { GoogleDriveFile } from '../types';

const getIconLink = (type: string, link: string): string => {
    if (type === 'Pasta') {
        return 'https://ssl.gstatic.com/docs/doclist/images/infinite_folder_favicon_2.png';
    }
    if (link.includes('spreadsheets')) {
        return 'https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_spreadsheet_x16.png';
    }
    if (link.includes('document')) {
        return 'https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_document_x16.png';
    }
    return 'https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_resource_x16.png';
};

export const mockDriveFiles: GoogleDriveFile[] = [
  {
    id: '1Z3HBpj47w6LM',
    name: 'APPS PYTHON',
    webViewLink: 'https://drive.google.com/drive/folders/1Z3HBpj47w6LM8ZJMqOKPR3QyRmHtHSd9',
    iconLink: getIconLink('Pasta', 'https://drive.google.com/drive/folders/1Z3HBpj47w6LM8ZJMqOKPR3QyRmHtHSd9')
  },
  {
    id: '1EA9HKOCSsTv',
    name: 'app exportar',
    webViewLink: 'https://docs.google.com/document/d/1EA9HKoCSsTvIZjPdblLa-DmDzYBclYttE7xdHyP4Fgo/edit?usp=drivesdk',
    iconLink: getIconLink('Arquivo', 'https://docs.google.com/document/d/1EA9HKoCSsTvIZjPdblLa-DmDzYBclYttE7xdHyP4Fgo/edit?usp=drivesdk')
  },
  {
    id: '1sdCzRwRgM-U',
    name: 'LOUSA_V1.0_G',
    webViewLink: 'https://drive.google.com/file/d/1sdCzRwRgM-UB5dhsG5I-8p8yHRDgdBZs/view?usp=drivesdk',
    iconLink: getIconLink('Arquivo', 'https://drive.google.com/file/d/1sdCzRwRgM-UB5dhsG5I-8p8yHRDgdBZs/view?usp=drivesdk')
  },
  {
    id: '19T9fmKCuF1qh',
    name: 'CAC ATUALIZAD',
    webViewLink: 'https://drive.google.com/file/d/19T9fmKCuF1qNMJsM0ISpej0dJNeCZpnb/view?usp=drivesdk',
    iconLink: getIconLink('Arquivo', 'https://drive.google.com/file/d/19T9fmKCuF1qNMJsM0ISpej0dJNeCZpnb/view?usp=drivesdk')
  },
  {
    id: '1Nt6S3VbPsyXta',
    name: 'Planilha sem títul',
    webViewLink: 'https://docs.google.com/spreadsheets/d/1Nt6S3VbPsyXtaHEneiHUWEZyqTsF-Pm_V3JPff9_-Nk/edit?usp=drivesdk',
    iconLink: getIconLink('Arquivo', 'https://docs.google.com/spreadsheets/d/1Nt6S3VbPsyXtaHEneiHUWEZyqTsF-Pm_V3JPff9_-Nk/edit?usp=drivesdk')
  },
  {
    id: '1UMBiq8-ydetAH',
    name: 'Planilha_Atualiza',
    webViewLink: 'https://docs.google.com/spreadsheets/d/1UMBiq8-ydetAH7LCBq5Snb2AuXdyyjjwnrQ6upfofN4/edit?usp=drivesdk',
    iconLink: getIconLink('Arquivo', 'https://docs.google.com/spreadsheets/d/1UMBiq8-ydetAH7LCBq5Snb2AuXdyyjjwnrQ6upfofN4/edit?usp=drivesdk')
  },
  {
    id: '1-m651GVf76KF',
    name: 'B.I ANALISE DE',
    webViewLink: 'https://drive.google.com/drive/folders/1-m651GVf76KFjehs61pMcax505DBwKOe',
    iconLink: getIconLink('Pasta', 'https://drive.google.com/drive/folders/1-m651GVf76KFjehs61pMcax505DBwKOe')
  },
  {
    id: '18So9Vhflo4hYZ',
    name: 'OS DESAFIOS',
    webViewLink: 'https://docs.google.com/document/d/18So9Vhflo4hYZGlquhIn5GcxogGRBTFuGFhl1jmLTmU/edit?usp=drivesdk',
    iconLink: getIconLink('Arquivo', 'https://docs.google.com/document/d/18So9Vhflo4hYZGlquhIn5GcxogGRBTFuGFhl1jmLTmU/edit?usp=drivesdk')
  },
  {
    id: '1_aXVQy6axbAv',
    name: 'Extratos Santand',
    webViewLink: 'https://drive.google.com/drive/folders/1aXVQy6axbAv0Lzov8t2SzJ5pU93-TfA',
    iconLink: getIconLink('Pasta', 'https://drive.google.com/drive/folders/1aXVQy6axbAv0Lzov8t2SzJ5pU93-TfA')
  },
  {
    id: '1qZ9-qmulIQJM',
    name: 'Extrato consolida',
    webViewLink: 'https://drive.google.com/file/d/1qZ9-qmulIQJMoRTrS4fUYUzaUSvOEUFh/view?usp=drivesdk',
    iconLink: getIconLink('Arquivo', 'https://drive.google.com/file/d/1qZ9-qmulIQJMoRTrS4fUYUzaUSvOEUFh/view?usp=drivesdk')
  },
  {
    id: '1RbFGHVSdB8V',
    name: 'Extrato consolida',
    webViewLink: 'https://drive.google.com/file/d/1RbFGHVSdB8W4nlRqCGz0AEFxV-KXd6j6/view?usp=drivesdk',
    iconLink: getIconLink('Arquivo', 'https://drive.google.com/file/d/1RbFGHVSdB8W4nlRqCGz0AEFxV-KXd6j6/view?usp=drivesdk')
  },
  {
    id: '1ymJnE5-AuDJB',
    name: 'monofasico mon',
    webViewLink: 'https://drive.google.com/drive/folders/1ymJnE5-AuDJBaxbLolzX_d7eZlck_OSF',
    iconLink: getIconLink('Pasta', 'https://drive.google.com/drive/folders/1ymJnE5-AuDJBaxbLolzX_d7eZlck_OSF')
  },
  {
    id: '1GRGxyI9A_uU',
    name: 'AULA SIMPLES',
    webViewLink: 'https://drive.google.com/file/d/1GRGxyI9A_uUQniCSppidCZpcvQPghD0-/view?usp=drivesdk',
    iconLink: getIconLink('Arquivo', 'https://drive.google.com/file/d/1GRGxyI9A_uUQniCSppidCZpcvQPghD0-/view?usp=drivesdk')
  },
  {
    id: '1-BkJXINcvW7vd',
    name: 'DIREITO FACAM',
    webViewLink: 'https://drive.google.com/drive/folders/1-BkJXINcvW7vqpP9lv46OrAENmTr8hWB',
    iconLink: getIconLink('Pasta', 'https://drive.google.com/drive/folders/1-BkJXINcvW7vqpP9lv46OrAENmTr8hWB')
  },
  {
    id: '1dES5k1sYascS',
    name: '1. Peticao_Desar',
    webViewLink: 'https://drive.google.com/file/d/1dES5k1sYascSILzdTscdSbMd2TNxyHzp/view?usp=drivesdk',
    iconLink: getIconLink('Arquivo', 'https://drive.google.com/file/d/1dES5k1sYascSILzdTscdSbMd2TNxyHzp/view?usp=drivesdk')
  },
  {
    id: '1UCm2OE3nBBi',
    name: 'Hermeneutica Ju',
    webViewLink: 'https://drive.google.com/drive/folders/1UCm2OE3nBBixAdWM7s71R_2M_IUA_Dii',
    iconLink: getIconLink('Pasta', 'https://drive.google.com/drive/folders/1UCm2OE3nBBixAdWM7s71R_2M_IUA_Dii')
  },
  {
    id: '130K3LSm4RcR',
    name: 'Ciência Polític',
    webViewLink: 'https://drive.google.com/drive/folders/130K3LSm4RcRvGFCbFWn-ZlJaePduVHAr',
    iconLink: getIconLink('Pasta', 'https://drive.google.com/drive/folders/130K3LSm4RcRvGFCbFWn-ZlJaePduVHAr')
  },
  {
    id: '1hnjtRPN6Roem',
    name: 'Teoria Geral c',
    webViewLink: 'https://drive.google.com/drive/folders/1hnjtRPN6RoemcKu3Zh0v3W-sslpV_WIX',
    iconLink: getIconLink('Pasta', 'https://drive.google.com/drive/folders/1hnjtRPN6RoemcKu3Zh0v3W-sslpV_WIX')
  },
];
