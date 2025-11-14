import React from 'react';

interface InstallationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Section: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="mb-6">
        <h3 className="text-xl font-bold text-blue-300 mb-3 flex items-center">
            <i className={`fas ${icon} mr-3 w-6 text-center`}></i>
            {title}
        </h3>
        <div className="pl-9 text-gray-300 space-y-4">{children}</div>
    </div>
);

const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h4 className="font-semibold text-gray-100 mb-2">{title}</h4>
        <ul className="list-disc list-outside ml-5 space-y-1 text-sm">{children}</ul>
    </div>
);

const InstallationGuideModal: React.FC<InstallationGuideModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl m-4 border border-gray-700 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b border-gray-700 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-gray-100 flex items-center">
                        <i className="fas fa-book-open mr-3 text-blue-400"></i>
                        Guia Completo: Instalação de Forro de PVC
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <i className="fas fa-times text-2xl"></i>
                    </button>
                </header>
                <main className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 space-y-6">
                    <p className="text-gray-400 italic text-center">Um guia detalhado para garantir uma instalação profissional e segura do seu forro de PVC.</p>
                    
                    <Section title="1. Planejamento e Materiais" icon="fa-ruler-combined">
                        <SubSection title="Calcular Área do Teto:">
                            <li>Meça o comprimento e a largura do ambiente.</li>
                            <li>Multiplique <strong>comprimento x largura</strong> para obter a área em m².</li>
                        </SubSection>
                        <SubSection title="Calcular Réguas de PVC:">
                            <li>Defina a direção de instalação das réguas (geralmente no sentido do menor lado).</li>
                            <li>Divida a medida da parede perpendicular à direção das réguas pela largura da régua (ex: 0,20m).</li>
                            <li>Adquira <strong>5% a 10% a mais</strong> de material para perdas e recortes.</li>
                        </SubSection>
                        <SubSection title="Calcular Estrutura Metálica (Metalons):">
                             <li>Defina o espaçamento entre perfis (<strong>50 a 60 cm</strong>).</li>
                             <li>Divida a largura do cômodo pelo espaçamento para saber o número de perfis.</li>
                             <li>Multiplique o resultado pelo comprimento do cômodo para obter a metragem linear total.</li>
                        </SubSection>
                         <SubSection title="Calcular Perfis de Acabamento e Acessórios:">
                             <li><strong>Rodaforro (Moldura):</strong> Some o comprimento de todas as paredes (perímetro do ambiente).</li>
                             <li><strong>Perfil "H":</strong> Use para unir réguas se o ambiente for maior que o comprimento da régua.</li>
                             <li><strong>Cantoneiras (Perfil "L"):</strong> Para cantos e quinas, conforme necessidade.</li>
                        </SubSection>
                    </Section>

                    <Section title="2. Preparação e Ferramentas" icon="fa-tools">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-700/50 p-4 rounded-lg border border-yellow-500/50">
                                <h4 className="font-semibold text-yellow-300 mb-2 flex items-center"><i className="fas fa-toolbox mr-2"></i>Ferramentas Essenciais</h4>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                    <li>Furadeira / Parafusadeira</li>
                                    <li>Trena e Lápis</li>
                                    <li>Nível (mangueira ou laser)</li>
                                    <li>Serra (arco, tico-tico) ou Estilete Reforçado</li>
                                    <li>Escada segura</li>
                                </ul>
                            </div>
                             <div className="bg-gray-700/50 p-4 rounded-lg border border-red-500/50">
                                <h4 className="font-semibold text-red-300 mb-2 flex items-center"><i className="fas fa-hard-hat mr-2"></i>Segurança (EPIs)</h4>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                    <li>Luvas de proteção</li>
                                    <li>Óculos de segurança</li>
                                </ul>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3"><i className="fas fa-info-circle mr-1"></i><strong>Armazenamento:</strong> Guarde as réguas de PVC na horizontal, em local seco e protegido do sol direto.</p>
                    </Section>

                    <Section title="3. Processo de Instalação" icon="fa-clipboard-list">
                        <ol className="list-decimal list-outside ml-5 space-y-3 text-sm">
                            <li><strong>Marcar Nível:</strong> Defina a altura do forro (mínimo 1m do telhado) e use um nível para marcar todos os cantos.</li>
                            <li><strong>Fixar Rodaforros:</strong> Fixe os rodaforros (molduras) nas paredes, alinhados com a marcação de nível, usando buchas e parafusos.</li>
                            <li><strong>Montar Estrutura:</strong> Instale a estrutura de metalon no teto original (laje/vigas), com espaçamento de 50 cm, nivelando-a com os rodaforros.</li>
                            <li><strong>Fixar Tirantes:</strong> Prenda hastes de arame na laje e conecte-as à estrutura para o nivelamento final.</li>
                            <li><strong>Instalar Réguas de PVC:</strong> Corte as réguas com uma folga de 0,5 a 1 cm para dilatação. Encaixe a primeira régua no rodaforro e fixe-a na estrutura com parafusos ponta-agulha, continuando o encaixe macho-fêmea.</li>
                            <li><strong>Acabamento Final:</strong> Meça e corte a última régua na largura necessária e encaixe-a, usando uma espátula se preciso.</li>
                        </ol>
                    </Section>
                    
                    <Section title="4. Melhores Práticas e Manutenção" icon="fa-check-circle">
                        <ul className="list-disc list-outside ml-5 space-y-2 text-sm">
                            <li><strong>Temperatura:</strong> Não exponha o PVC a mais de 45°C. Use isolamento térmico (lã de vidro/EPS) em telhados quentes sem laje.</li>
                            <li><strong>Fixação de Objetos:</strong> Luminárias e ventiladores devem ser fixados na laje ou na estrutura de metalon, <strong>nunca</strong> diretamente no forro.</li>
                            <li><strong>Limpeza:</strong> Use um pano macio com água e detergente neutro. Evite produtos abrasivos ou solventes.</li>
                            <li><strong>Efeitos Curvos:</strong> Para curvar o rodaforro, aqueça-o cuidadosamente com um soprador térmico.</li>
                        </ul>
                    </Section>

                </main>
            </div>
        </div>
    );
};

export default InstallationGuideModal;