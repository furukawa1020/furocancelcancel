import React, { useEffect } from 'react';
import { useAudioContext } from '../components/useAudioContext';

const Done = () => {
    const { playHotaru } = useAudioContext();

    useEffect(() => {
        playHotaru();
    }, []);

    return (
        <div className="h-screen w-screen bg-[#0B0F19] flex flex-col items-center justify-center text-[#F0F4F8] font-serif relative overflow-hidden">
            <div className="z-10 text-center space-y-12">
                <h1 className="text-[5rem] font-bold tracking-widest drop-shadow-xl">
                    休め。
                </h1>

                <div className="space-y-6 opacity-0 animate-[fadeIn_1s_ease-in-out_2s_forwards]">
                    <p className="text-sm tracking-wider opacity-70">
                        今日はこれで問題なかった？
                    </p>

                    <div className="flex gap-6 justify-center">
                        <button className="px-8 py-3 border border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white transition-colors duration-300">
                            問題なし
                        </button>
                        <button className="px-8 py-3 border border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition-colors duration-300">
                            ダメ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Done;
