<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║               MASS BOOK SEEDER — 10,000 TITLES              ║
 * ║                                                              ║
 * ║  Generates realistic academic book records with 1–3          ║
 * ║  physical copies each, using ONLY existing system            ║
 * ║  categories and colleges.                                    ║
 * ║                                                              ║
 * ║  Usage:  php artisan db:seed --class=MassBookSeeder          ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
class MassBookSeeder extends Seeder
{
    private const TOTAL_TITLES = 10000;
    private const CHUNK_SIZE = 500;

    /**
     * System categories (from BookForm.jsx) — weighted.
     * "Book" is the most common resource type in any library.
     */
    private const CATEGORIES = [
        'Book'                               => 50,
        'Thesis'                             => 20,
        'Article'                            => 10,
        'Computer File/Electronic Resources' => 8,
        'Visual Materials'                   => 7,
        'Map'                                => 5,
    ];

    /**
     * System colleges (from BookForm.jsx).
     */
    private const COLLEGES = [
        'GENERAL',
        'COLLEGE OF CRIMINOLOGY',
        'COLLEGE OF MARITIME',
        'COLLEGE OF INFORMATION TECHNOLOGY',
        'COLLEGE OF HOSPITALITY & TOURISM MANAGEMENT',
        'COLLEGE OF BUSINESS ADMINISTRATION',
        'COLLEGE OF EDUCATION',
    ];

    /**
     * Publisher pool — Philippine + International publishers.
     */
    private const PUBLISHERS = [
        // Philippine Publishers
        'Rex Bookstore', 'C&E Publishing', 'Anvil Publishing',
        'Abiva Publishing', 'Phoenix Publishing', 'National Bookstore Publishing',
        'University of the Philippines Press', 'Ateneo de Manila UP',
        'Vibal Group', 'Mutya Publishing', 'JMC Press',
        'Cacho Hermanos', 'Bookmark Inc.', 'Central Books',
        'OMF Literature', 'New Day Publishers', 'Claretian Publications',
        // International Publishers
        'Pearson Education', 'McGraw-Hill Education', 'Cengage Learning',
        'John Wiley & Sons', 'Oxford University Press', 'Cambridge University Press',
        'Springer', 'Elsevier', 'Routledge', 'SAGE Publications',
        'Houghton Mifflin Harcourt', 'Scholastic', 'HarperCollins',
        'Prentice Hall', 'Addison-Wesley', 'Thomson Reuters',
        'Macmillan Publishers', 'Simon & Schuster', 'Random House',
        'Academic Press', 'MIT Press', 'Taylor & Francis',
    ];

    /**
     * Places of publication.
     */
    private const PLACES = [
        'Manila', 'Quezon City', 'Makati', 'Cebu City', 'Davao City',
        'Mandaluyong', 'Pasig', 'Taguig', 'Caloocan', 'Las Piñas',
        'New York', 'London', 'Singapore', 'Tokyo', 'Sydney',
        'Boston', 'San Francisco', 'Chicago', 'Los Angeles', 'Toronto',
    ];

    /**
     * Title templates by category and college context.
     */
    private const TITLE_PREFIXES = [
        'Introduction to', 'Fundamentals of', 'Principles of', 'Advanced',
        'Modern', 'Essential', 'Applied', 'Practical', 'Understanding',
        'Exploring', 'Concepts in', 'Foundations of', 'Handbook of',
        'A Guide to', 'Studies in', 'Elements of', 'Theory of',
        'Contemporary', 'Perspectives on', 'Readings in',
    ];

    /**
     * Subject domains per college for realistic title generation.
     */
    private const COLLEGE_SUBJECTS = [
        'GENERAL' => [
            'Filipino Literature', 'Philippine History', 'Mathematics',
            'General Psychology', 'Sociology', 'Philosophy', 'Ethics',
            'Physical Education', 'Health Sciences', 'Environmental Science',
            'Art Appreciation', 'Music Theory', 'World History', 'Economics',
            'Political Science', 'Statistics', 'English Communication',
            'Critical Thinking', 'Research Methods', 'Human Behavior',
            'Cultural Studies', 'Logic', 'Public Speaking', 'Anthropology',
        ],
        'COLLEGE OF CRIMINOLOGY' => [
            'Criminal Law', 'Criminalistics', 'Crime Detection',
            'Law Enforcement Administration', 'Forensic Science',
            'Juvenile Delinquency', 'Criminal Justice', 'Penology',
            'Corrections Administration', 'Criminal Investigation',
            'Industrial Security', 'Philippine Criminal Justice System',
            'Drug Education', 'Traffic Management', 'Ballistics',
            'Questioned Documents', 'Legal Medicine', 'Criminal Sociology',
            'Police Organization', 'Human Rights', 'Cybercrime',
            'Victimology', 'Court Procedures', 'Evidence Law',
        ],
        'COLLEGE OF MARITIME' => [
            'Marine Engineering', 'Navigation', 'Seamanship',
            'Maritime Law', 'Ship Construction', 'Marine Diesel Engines',
            'Cargo Handling', 'Maritime Safety', 'Meteorology',
            'Oceanography', 'Ship Management', 'Marine Electronics',
            'Naval Architecture', 'Port Operations', 'Maritime Economics',
            'Marine Environmental Protection', 'Shipboard Operations',
            'Celestial Navigation', 'Radar Navigation', 'GMDSS Operations',
            'Marine Electrical Systems', 'Hydraulics', 'Thermodynamics',
            'Fluid Mechanics',
        ],
        'COLLEGE OF INFORMATION TECHNOLOGY' => [
            'Computer Programming', 'Database Management', 'Web Development',
            'Data Structures', 'Algorithms', 'Operating Systems',
            'Computer Networks', 'Software Engineering', 'Cybersecurity',
            'Artificial Intelligence', 'Machine Learning', 'Cloud Computing',
            'Mobile Application Development', 'Systems Analysis',
            'Object-Oriented Programming', 'Digital Electronics',
            'Computer Architecture', 'Information Systems', 'Python Programming',
            'Java Programming', 'Web Design', 'Data Analytics',
            'IT Project Management', 'Human-Computer Interaction',
        ],
        'COLLEGE OF HOSPITALITY & TOURISM MANAGEMENT' => [
            'Hospitality Management', 'Tourism Planning', 'Food Service Management',
            'Hotel Operations', 'Event Management', 'Travel Agency Operations',
            'Culinary Arts', 'Food and Beverage Management', 'Front Office Management',
            'Housekeeping Management', 'Tourism Marketing', 'Ecotourism',
            'Heritage Tourism', 'Destination Management', 'Resort Management',
            'Catering Management', 'Bartending', 'Baking and Pastry Arts',
            'Nutrition and Dietetics', 'Customer Service Excellence',
            'Sustainable Tourism', 'Airline Operations', 'Convention Management',
            'Filipino Cuisine',
        ],
        'COLLEGE OF BUSINESS ADMINISTRATION' => [
            'Financial Management', 'Marketing Management', 'Human Resource Management',
            'Operations Management', 'Business Law', 'Entrepreneurship',
            'Accounting', 'Managerial Economics', 'Strategic Management',
            'Organizational Behavior', 'Business Ethics', 'Supply Chain Management',
            'International Business', 'Taxation', 'Auditing',
            'Cost Accounting', 'Business Statistics', 'Corporate Finance',
            'Banking and Finance', 'Investment Management',
            'Business Communication', 'E-Commerce', 'Real Estate Management',
            'Insurance Management',
        ],
        'COLLEGE OF EDUCATION' => [
            'Educational Psychology', 'Curriculum Development', 'Teaching Strategies',
            'Assessment of Learning', 'Educational Technology', 'Classroom Management',
            'Child Development', 'Special Education', 'Inclusive Education',
            'Filipino Language Teaching', 'English Language Teaching',
            'Mathematics Education', 'Science Education', 'Social Studies Education',
            'Physical Education Methods', 'Music Education',
            'Art Education', 'Early Childhood Education', 'Values Education',
            'Professional Ethics for Teachers', 'School Administration',
            'Guidance and Counseling', 'Multicultural Education', 'Literacy Studies',
        ],
    ];

    /**
     * Author name pools for realistic generation.
     */
    private const AUTHOR_FIRST = [
        'Jose', 'Maria', 'Antonio', 'Roberto', 'Fernando', 'Ricardo',
        'Eduardo', 'Francisco', 'Rosa', 'Elena', 'Carlos', 'Lourdes',
        'Manuel', 'Teresita', 'Miguel', 'Corazon', 'Armando', 'Carmen',
        'Alfredo', 'Patricia', 'David', 'Susan', 'James', 'Elizabeth',
        'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Barbara',
        'Richard', 'Margaret', 'Thomas', 'Dorothy', 'Christopher', 'Sarah',
        'John', 'Karen', 'Daniel', 'Nancy', 'Gregorio', 'Estrella',
        'Ramon', 'Esperanza', 'Ernesto', 'Remedios', 'Julio', 'Milagros',
    ];

    private const AUTHOR_LAST = [
        'Santos', 'Reyes', 'Cruz', 'Garcia', 'Mendoza', 'Torres',
        'Ramos', 'Aquino', 'Rivera', 'Gonzales', 'Fernandez', 'Lopez',
        'Bautista', 'Navarro', 'Flores', 'Villanueva', 'Castillo',
        'Soriano', 'Aguilar', 'Domingo', 'Smith', 'Johnson', 'Williams',
        'Brown', 'Jones', 'Davis', 'Wilson', 'Anderson', 'Taylor',
        'Martinez', 'Hernandez', 'Moore', 'Jackson', 'White', 'Harris',
        'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Hall',
        'Panganiban', 'Lacson', 'Dimaculangan', 'Sarmiento', 'Tolentino',
    ];

    /**
     * Dewey Decimal Classification ranges by college.
     */
    private const DEWEY_RANGES = [
        'GENERAL'                                       => ['000', '100', '200', '300', '400', '800', '900'],
        'COLLEGE OF CRIMINOLOGY'                        => ['340', '345', '363', '364', '365'],
        'COLLEGE OF MARITIME'                           => ['620', '623', '627', '629', '551'],
        'COLLEGE OF INFORMATION TECHNOLOGY'             => ['004', '005', '006', '621'],
        'COLLEGE OF HOSPITALITY & TOURISM MANAGEMENT'   => ['640', '641', '642', '647', '910'],
        'COLLEGE OF BUSINESS ADMINISTRATION'            => ['330', '332', '338', '650', '657', '658'],
        'COLLEGE OF EDUCATION'                          => ['370', '371', '372', '373', '375'],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('');
        $this->command->info('╔══════════════════════════════════════════════════╗');
        $this->command->info('║      MASS BOOK SEEDER — 10,000 Titles           ║');
        $this->command->info('╚══════════════════════════════════════════════════╝');
        $this->command->info('');

        $now = Carbon::now();

        // ── Phase 1: Generate Book Titles ──────────────────────────
        $this->command->info('  📚 Phase 1: Generating 10,000 book titles...');

        // Find the latest accession number to avoid collisions
        $year = '2026';
        $accPrefix = 'LIB-' . $year . '-';
        $latestAcc = DB::table('book_assets')
            ->where('asset_code', 'like', 'LIB-' . $year . '-%')
            ->orderBy('asset_code', 'desc')
            ->value('asset_code');
        $latestBookAcc = DB::table('book_assets')
            ->where('asset_code', 'like', 'BOOK-' . $year . '-%')
            ->orderBy('asset_code', 'desc')
            ->value('asset_code');

        $assetSequence = 1;
        if ($latestAcc) {
            $assetSequence = max($assetSequence, (int) substr($latestAcc, strlen($accPrefix)) + 1);
        }
        if ($latestBookAcc) {
            $bookPrefix = 'BOOK-' . $year . '-';
            $assetSequence = max($assetSequence, (int) substr($latestBookAcc, strlen($bookPrefix)) + 1);
        }

        // Build weighted category pool
        $categoryPool = [];
        foreach (self::CATEGORIES as $cat => $weight) {
            for ($w = 0; $w < $weight; $w++) {
                $categoryPool[] = $cat;
            }
        }

        // Pre-generate unique ISBNs
        $usedIsbns = DB::table('book_titles')->pluck('isbn')->flip()->toArray();

        $titleBatch = [];
        $titleMeta = []; // Store category+college for each title for assets phase
        $titleInsertedCount = 0;
        $generatedTitles = []; // Track to avoid duplicate titles

        $bar = $this->command->getOutput()->createProgressBar(self::TOTAL_TITLES);
        $bar->setFormat(" %current%/%max% [%bar%] %percent:3s%% • %elapsed:6s% elapsed");
        $bar->start();

        for ($i = 0; $i < self::TOTAL_TITLES; $i++) {
            $category = $categoryPool[array_rand($categoryPool)];
            $college = self::COLLEGES[array_rand(self::COLLEGES)];
            $subjects = self::COLLEGE_SUBJECTS[$college];
            $subject = $subjects[array_rand($subjects)];
            $prefix = self::TITLE_PREFIXES[array_rand(self::TITLE_PREFIXES)];

            // Generate a unique title
            $title = $prefix . ' ' . $subject;
            $attempts = 0;
            while (isset($generatedTitles[strtolower($title)]) && $attempts < 10) {
                $suffix = $this->titleSuffix();
                $title = $prefix . ' ' . $subject . $suffix;
                $attempts++;
            }
            $generatedTitles[strtolower($title)] = true;

            // Generate unique ISBN-13
            $isbn = $this->generateUniqueIsbn($usedIsbns);
            $usedIsbns[$isbn] = true;

            $authorFirst = self::AUTHOR_FIRST[array_rand(self::AUTHOR_FIRST)];
            $authorLast = self::AUTHOR_LAST[array_rand(self::AUTHOR_LAST)];

            // Sometimes add a second author
            $author = $authorLast . ', ' . $authorFirst;
            if (mt_rand(1, 100) <= 20) {
                $author2Last = self::AUTHOR_LAST[array_rand(self::AUTHOR_LAST)];
                $author2First = self::AUTHOR_FIRST[array_rand(self::AUTHOR_FIRST)];
                $author .= ' & ' . $author2Last . ', ' . $author2First;
            }

            $publishedYear = mt_rand(2000, 2025);
            $copyrightYear = $publishedYear; // Usually the same or close
            $deweyRanges = self::DEWEY_RANGES[$college];
            $deweyBase = $deweyRanges[array_rand($deweyRanges)];
            $callNumber = $deweyBase . '.' . mt_rand(10, 99) . ' ' . strtoupper(substr($authorLast, 0, 3)) . ' ' . $publishedYear;

            $pages = mt_rand(80, 950);
            $price = round(mt_rand(150, 3500) / 10, 2) * 10; // Rounded Philippine peso prices

            $copiesForThisTitle = mt_rand(1, 3);

            $titleBatch[] = [
                'title'                => $title,
                'subtitle'             => (mt_rand(1, 100) <= 30) ? $this->generateSubtitle($subject) : null,
                'author'               => $author,
                'isbn'                 => $isbn,
                'accession_no'         => $accPrefix . str_pad($assetSequence, 5, '0', STR_PAD_LEFT),
                'lccn'                 => (mt_rand(1, 100) <= 40) ? mt_rand(2000, 2025) . str_pad(mt_rand(1, 999999), 6, '0', STR_PAD_LEFT) : null,
                'issn'                 => ($category === 'Article') ? str_pad(mt_rand(1000, 9999), 4, '0', STR_PAD_LEFT) . '-' . str_pad(mt_rand(1000, 9999), 4, '0', STR_PAD_LEFT) : null,
                'category'             => $category,
                'college'              => $college,
                'publisher'            => self::PUBLISHERS[array_rand(self::PUBLISHERS)],
                'place_of_publication' => self::PLACES[array_rand(self::PLACES)],
                'published_year'       => $publishedYear,
                'copyright_year'       => $copyrightYear,
                'call_number'          => $callNumber,
                'physical_description' => $pages . 'p.' . (mt_rand(1, 100) <= 40 ? ', ill.' : ''),
                'edition'              => (mt_rand(1, 100) <= 30) ? mt_rand(1, 8) : null,
                'series'               => null,
                'volume'               => (mt_rand(1, 100) <= 15) ? mt_rand(1, 5) : null,
                'pages'                => $pages,
                'price'                => $price,
                'book_penalty'         => 0.00,
                'language'             => 'English',
                'description'          => null,
                'location'             => 'Main Library',
                'image_path'           => null,
                'cover_image'          => null,
                'created_at'           => $now,
                'updated_at'           => $now,
            ];

            $titleMeta[] = [
                'copies' => $copiesForThisTitle,
            ];

            $assetSequence++; // Reserve the base accession number

            // Flush batch
            if (count($titleBatch) >= self::CHUNK_SIZE) {
                $this->insertTitleBatch($titleBatch, $titleMeta, $titleInsertedCount, $assetSequence, $now, $accPrefix);
                $titleInsertedCount += count($titleBatch);
                $bar->advance(count($titleBatch));
                $titleBatch = [];
                $titleMeta = [];
            }
        }

        // Insert remaining titles
        if (!empty($titleBatch)) {
            $this->insertTitleBatch($titleBatch, $titleMeta, $titleInsertedCount, $assetSequence, $now, $accPrefix);
            $titleInsertedCount += count($titleBatch);
            $bar->advance(count($titleBatch));
        }

        $bar->finish();
        $this->command->info('');

        // ── Phase 2: Generate Book Assets ──────────────────────────
        $this->command->info('');
        $this->command->info('  📦 Phase 2: Generating physical copies (assets)...');

        $allTitles = DB::table('book_titles')
            ->orderBy('id', 'desc')
            ->limit(self::TOTAL_TITLES)
            ->select('id')
            ->get();

        // Find max asset sequence again
        $latestAcc = DB::table('book_assets')
            ->where('asset_code', 'like', $accPrefix . '%')
            ->orderBy('asset_code', 'desc')
            ->value('asset_code');
        $assetSeq = 1;
        if ($latestAcc) {
            $assetSeq = (int) substr($latestAcc, strlen($accPrefix)) + 1;
        }

        $assetBatch = [];
        $totalAssets = 0;

        $bar2 = $this->command->getOutput()->createProgressBar(count($allTitles));
        $bar2->setFormat(" %current%/%max% [%bar%] %percent:3s%% • %elapsed:6s% elapsed");
        $bar2->start();

        foreach ($allTitles as $titleRow) {
            $copies = mt_rand(1, 3);

            for ($c = 0; $c < $copies; $c++) {
                $assetCode = $accPrefix . str_pad($assetSeq, 5, '0', STR_PAD_LEFT);
                $assetSeq++;

                $assetBatch[] = [
                    'book_title_id' => $titleRow->id,
                    'asset_code'    => $assetCode,
                    'building'      => 'Main Library',
                    'aisle'         => mt_rand(1, 12),
                    'shelf'         => mt_rand(1, 8),
                    'status'        => 'available',
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ];

                $totalAssets++;

                if (count($assetBatch) >= self::CHUNK_SIZE) {
                    DB::table('book_assets')->insert($assetBatch);
                    $assetBatch = [];
                }
            }

            $bar2->advance();
        }

        if (!empty($assetBatch)) {
            DB::table('book_assets')->insert($assetBatch);
        }

        $bar2->finish();
        $this->command->info('');
        $this->command->info('');
        $this->command->info("  ✅  Successfully seeded {$titleInsertedCount} book titles.");
        $this->command->info("  📦  Generated {$totalAssets} physical copies (assets).");
        $this->command->info("  📂  Categories: Article, Book, Computer File/Electronic Resources, Map, Thesis, Visual Materials");
        $this->command->info("  🏛️   Colleges: All 7 system colleges");
        $this->command->info('');
    }

    /**
     * Insert a batch of titles into the database.
     */
    private function insertTitleBatch(array &$batch, array &$meta, int $offset, int &$assetSeq, Carbon $now, string $accPrefix): void
    {
        DB::table('book_titles')->insert($batch);
    }

    /**
     * Generate a unique ISBN-13.
     */
    private function generateUniqueIsbn(array &$used): string
    {
        do {
            $isbn = '978' . str_pad(mt_rand(0, 9999999999), 10, '0', STR_PAD_LEFT);
        } while (isset($used[$isbn]));
        return $isbn;
    }

    /**
     * Generate a title suffix for uniqueness.
     */
    private function titleSuffix(): string
    {
        $suffixes = [
            ' (Revised Edition)', ' (2nd Edition)', ' (3rd Edition)',
            ' (Philippine Context)', ' (A Comprehensive Guide)',
            ' for Beginners', ' for Professionals', ' in Practice',
            ' and Applications', ' — A Modern Approach',
            ' (Vol. ' . mt_rand(1, 5) . ')', ' (Updated)',
            ': Theory and Practice', ': Concepts and Methods',
            ' in the Philippines', ' — An Overview',
            ' (Latest Edition)', ': Case Studies',
        ];
        return $suffixes[array_rand($suffixes)];
    }

    /**
     * Generate a subtitle for a subject.
     */
    private function generateSubtitle(string $subject): string
    {
        $templates = [
            "A Comprehensive Study of $subject",
            "Theories, Concepts, and Applications",
            "Principles and Practices for Today",
            "An Integrated Approach",
            "Contemporary Issues and Perspectives",
            "Tools, Techniques, and Best Practices",
            "From Theory to Application",
            "A Philippine Perspective",
        ];
        return $templates[array_rand($templates)];
    }
}
