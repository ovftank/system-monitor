import { faFacebook, faTelegram } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { FC } from 'react';

const FloatingInfo: FC = () => {
    return (
        <div className='fixed bottom-4 left-4 z-50'>
            <div className='flex flex-col gap-2'>
                <a href='https://t.me/ovftank' target='_blank' rel='noopener noreferrer' className='flex items-center gap-2 rounded-lg bg-stone-600 px-2 py-2 text-stone-50 shadow-lg transition-all hover:bg-stone-700 focus:ring-2 focus:ring-stone-500 focus:outline-none' title='Telegram'>
                    <FontAwesomeIcon icon={faTelegram} className='h-8 w-8' />
                </a>
                <a href='https://facebook.com/ovftank' target='_blank' rel='noopener noreferrer' className='flex items-center gap-2 rounded-lg bg-stone-600 px-2 py-2 text-stone-50 shadow-lg transition-all hover:bg-stone-700 focus:ring-2 focus:ring-stone-500 focus:outline-none' title='Facebook'>
                    <FontAwesomeIcon icon={faFacebook} className='h-8 w-8' />
                </a>
            </div>
        </div>
    );
};

export default FloatingInfo;
