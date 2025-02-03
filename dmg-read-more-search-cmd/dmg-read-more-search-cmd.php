<?php

/**
 * Plugin Name:       Dmg Read More Search Command
 * Description:       Dmg Read More Search Command
 * Version:           0.1.0
 * Author:            Sukhy
 */

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
    return;
}

class Dmg_Read_More {
    // wp dmg-read-more search
    public function search(array $args, array $assoc_args) {
        $date_before = $assoc_args['date-before'] ?? "";
        $date_after = $assoc_args['date-after'] ?? "";

        if ($date_before && $date_after) {
            $logMessage = "between {$date_after} && {$date_before}";
        } else {
            $date_before = date("Y-m-d");
            $date_after = date("Y-m-d", strtotime("-30 days"));
            $logMessage = "defaulting to the last 30 dates ({$date_after} - {$date_before})";
        }

        if ($date_before && !$this->isValidDate($date_before)) {
            WP_CLI::error("Invalid 'date-before': Please use YYYY-MM-DD format.");
        }

        if ($date_after && !$this->isValidDate($date_after)) {
            WP_CLI::error("Invalid 'date-after': Please use YYYY-MM-DD format.");
        }


        WP_CLI::log("Searching posts containing 'dmg-read-more' block {$logMessage} ...");

        /*
            **The command will execute a WP_Query search for Posts within the date range looking for posts containing the aforementioned Gutenberg block.**
            
            Was not sure which post type to search for as was not specified since the Gutenberg block could be added to pages, posts or custom post type, so commented it out to search across all post types
        */
        $query_args = [
            //"post_type" => ["post", "page"],
            "posts_per_page" => -1,
            "post_status" => "publish",
            "s" => "wp:create-block/dmg-read-more",
            "search_columns" => ["post_content"],
            "date_query" => [
                [
                    "before" => $date_before,
                    "after" => $date_after,
                    "inclusive" => true,
                ]
            ]
        ];

        $posts = new WP_Query($query_args);
        $foundPosts = [];

        if ($posts->have_posts()) {
            while ($posts->have_posts()) {
                $posts->the_post();
                $foundPosts[] = get_the_ID();
            }
        } else {
            WP_CLI::log("No posts found containing 'dmg-read-more' block");
        }

        wp_reset_postdata();

        if ($foundPosts) {
            WP_CLI::success("Matching post IDs: " . implode(",", $foundPosts));
        }
    }

    private function isValidDate(string $date, string $format = "Y-m-d"): bool {
        $d = DateTime::createFromFormat($format, $date);
        return $d && strtolower($d->format($format)) === strtolower($date);
    }
}

WP_CLI::add_command('dmg-read-more', 'Dmg_Read_More');