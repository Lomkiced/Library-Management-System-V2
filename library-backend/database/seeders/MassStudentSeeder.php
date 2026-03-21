<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║              MASS STUDENT SEEDER — 10,000 STUDENTS          ║
 * ║                                                              ║
 * ║  Generates realistic Filipino student records using          ║
 * ║  chunked batch inserts for maximum performance.              ║
 * ║                                                              ║
 * ║  Usage:  php artisan db:seed --class=MassStudentSeeder       ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
class MassStudentSeeder extends Seeder
{
    /**
     * Total number of students to generate.
     */
    private const TOTAL_STUDENTS = 10000;

    /**
     * Batch insert size for performance.
     */
    private const CHUNK_SIZE = 500;

    /**
     * Common Filipino first names (male + female).
     */
    private const FIRST_NAMES = [
        // Male
        'Juan', 'Jose', 'Mark', 'John', 'James', 'Michael', 'Carlo', 'Angelo',
        'Rafael', 'Miguel', 'Gabriel', 'Daniel', 'Joshua', 'Christian', 'Kenneth',
        'Patrick', 'Kevin', 'Ryan', 'Jayson', 'Renz', 'Aldrin', 'Arjay', 'Benedict',
        'Chester', 'Dominic', 'Elijah', 'Francis', 'Gerald', 'Harold', 'Ivan',
        'Jerick', 'Karl', 'Lance', 'Marvin', 'Nathan', 'Oliver', 'Paulo', 'Ricky',
        'Sean', 'Troy', 'Vincent', 'William', 'Xavier', 'Zachary', 'Adrian',
        'Bryan', 'Cedric', 'Darwin', 'Eugene', 'Ferdinand', 'Gian', 'Hector',
        'Isaiah', 'Jomar', 'Kyle', 'Lloyd', 'Marco', 'Neil', 'Oscar',
        'Peter', 'Rodel', 'Stephen', 'Timothy', 'Ulysses', 'Vergil',
        // Female
        'Maria', 'Ana', 'Rose', 'Mae', 'Joy', 'Grace', 'Faith', 'Hope',
        'Angel', 'Princess', 'Nicole', 'Ella', 'Sophia', 'Isabella', 'Jasmine',
        'Katherine', 'Lovely', 'Michelle', 'Patricia', 'Rachelle', 'Samantha',
        'Theresa', 'Victoria', 'Andrea', 'Bianca', 'Christine', 'Daisy',
        'Erika', 'Fatima', 'Gwen', 'Hannah', 'Irene', 'Janine', 'Kimberly',
        'Lorraine', 'Marian', 'Nadine', 'Olivia', 'Pauline', 'Regina',
        'Sheila', 'Trisha', 'Ursula', 'Vanessa', 'Wendy', 'Ximena',
        'Yvonne', 'Zara', 'Alyssa', 'Bea', 'Chloe', 'Diana', 'Elaine',
        'Francesca', 'Gia', 'Hazel', 'Ivy', 'Julia', 'Kaye', 'Lyka',
    ];

    /**
     * Common Filipino last names.
     */
    private const LAST_NAMES = [
        'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza',
        'Torres', 'Tomas', 'Andrada', 'Ramos', 'Aquino', 'Rivera', 'Navarro',
        'Gonzales', 'Lopez', 'Hernandez', 'Martinez', 'Flores', 'Pascual',
        'Villanueva', 'Dela Cruz', 'Dela Rosa', 'Dela Peña', 'De Leon',
        'De Guzman', 'De Jesus', 'Del Rosario', 'Castillo', 'Soriano',
        'Corpuz', 'Fernandez', 'Salazar', 'Aguilar', 'Domingo', 'Mercado',
        'Dizon', 'Lim', 'Tan', 'Uy', 'Chua', 'Go', 'Sy', 'Ang', 'Co',
        'Santiago', 'Manalo', 'Salvador', 'Concepcion', 'Rosales',
        'Medina', 'Luna', 'Velasco', 'Magsaysay', 'Tolentino',
        'Espiritu', 'Ignacio', 'Jimenez', 'Lagman', 'Morales',
        'Natividad', 'Pangilinan', 'Quezon', 'Roxas', 'Abad',
        'Bermudez', 'Capistrano', 'Dimaculangan', 'Enriquez', 'Fajardo',
        'Gutierrez', 'Hidalgo', 'Ilagan', 'Jacinto', 'Lacson',
        'Magbanua', 'Nacario', 'Oliva', 'Paraiso', 'Quijano',
        'Resurreccion', 'Sarmiento', 'Tiongson', 'Umali', 'Valdez',
    ];

    /**
     * Available courses (matching system).
     */
    private const COURSES = [
        'BSIT', 'BSED', 'BEED', 'Maritime',
        'BSHM', 'BS Criminology', 'BSBA', 'BS Tourism',
    ];

    /**
     * Sections.
     */
    private const SECTIONS = ['A', 'B', 'C', 'D'];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('');
        $this->command->info('╔══════════════════════════════════════════════════╗');
        $this->command->info('║     MASS STUDENT SEEDER — 10,000 Students        ║');
        $this->command->info('╚══════════════════════════════════════════════════╝');
        $this->command->info('');

        // Find the max existing student sequence to avoid collisions
        $year = '2026';
        $prefix = $year . '-';
        $latestStudent = DB::table('users')
            ->where('student_id', 'like', $prefix . '%')
            ->orderBy('student_id', 'desc')
            ->first();

        $startSequence = 1;
        if ($latestStudent) {
            $lastSequence = (int) substr($latestStudent->student_id, strlen($prefix));
            $startSequence = $lastSequence + 1;
        }

        $hashedPassword = Hash::make('student123');
        $now = Carbon::now();
        $batch = [];
        $totalInserted = 0;

        $bar = $this->command->getOutput()->createProgressBar(self::TOTAL_STUDENTS);
        $bar->setFormat(" %current%/%max% [%bar%] %percent:3s%% • %elapsed:6s% elapsed");
        $bar->start();

        for ($i = 0; $i < self::TOTAL_STUDENTS; $i++) {
            $sequence = $startSequence + $i;
            // Use 5-digit padding to handle >9999
            $studentId = $prefix . str_pad($sequence, max(4, strlen((string) $sequence)), '0', STR_PAD_LEFT);

            $firstName = self::FIRST_NAMES[array_rand(self::FIRST_NAMES)];
            $lastName = self::LAST_NAMES[array_rand(self::LAST_NAMES)];
            $name = $firstName . ' ' . $lastName;

            $course = self::COURSES[array_rand(self::COURSES)];

            // Weighted year level: more freshmen, fewer seniors
            $yearLevel = $this->weightedYearLevel();

            $section = self::SECTIONS[array_rand(self::SECTIONS)];

            $batch[] = [
                'student_id'  => $studentId,
                'name'        => $name,
                'email'       => $studentId . '@pclu.edu',
                'password'    => $hashedPassword,
                'role'        => 'student',
                'status'      => 'active',
                'course'      => $course,
                'year_level'  => $yearLevel,
                'section'     => $section,
                'created_at'  => $now,
                'updated_at'  => $now,
            ];

            // Flush batch
            if (count($batch) >= self::CHUNK_SIZE) {
                DB::table('users')->insert($batch);
                $totalInserted += count($batch);
                $bar->advance(count($batch));
                $batch = [];
            }
        }

        // Insert remaining
        if (!empty($batch)) {
            DB::table('users')->insert($batch);
            $totalInserted += count($batch);
            $bar->advance(count($batch));
        }

        $bar->finish();
        $this->command->info('');
        $this->command->info('');
        $this->command->info("  ✅  Successfully seeded {$totalInserted} students.");
        $this->command->info("  📋  Student IDs: {$prefix}" . str_pad($startSequence, 4, '0', STR_PAD_LEFT) . " → {$prefix}" . str_pad($startSequence + self::TOTAL_STUDENTS - 1, 5, '0', STR_PAD_LEFT));
        $this->command->info("  🔑  Default password: student123");
        $this->command->info('');
    }

    /**
     * Generate a weighted year level.
     * Distribution: ~35% Year 1, ~30% Year 2, ~20% Year 3, ~15% Year 4.
     */
    private function weightedYearLevel(): int
    {
        $rand = mt_rand(1, 100);
        if ($rand <= 35) return 1;
        if ($rand <= 65) return 2;
        if ($rand <= 85) return 3;
        return 4;
    }
}
