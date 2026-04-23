<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIndexesToBookTitlesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('book_titles', function (Blueprint $table) {
            $table->index('author', 'idx_book_author');
            $table->index('isbn', 'idx_book_isbn');
            $table->index('call_number', 'idx_book_call_number');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('book_titles', function (Blueprint $table) {
            $table->dropIndex('idx_book_author');
            $table->dropIndex('idx_book_isbn');
            $table->dropIndex('idx_book_call_number');
        });
    }
}
