import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { FC } from 'react';
import { useState } from 'react';

interface SearchProps {
    onSearch: (searchTerm: string) => void;
}

const Search: FC<SearchProps> = ({ onSearch }) => {
    const [searchTerm, setSearchTerm] = useState<string>('');

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        onSearch(value);
    };

    return (
        <div className='flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-100 px-4 py-3'>
            <div className='flex items-center gap-2 text-stone-600'>
                <FontAwesomeIcon icon={faSearch} className='h-4 w-4' />
                <span className='text-sm font-medium'>Tìm kiếm:</span>
            </div>

            <input type='text' value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} placeholder='Tìm kiếm theo User, HWID...' className='flex-1 rounded border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 focus:border-stone-500 focus:ring-2 focus:ring-stone-500 focus:outline-none' />
        </div>
    );
};

export default Search;
