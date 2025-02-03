/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.scss';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {Element} Element to render.
 */

import { PanelBody, TextControl, SelectControl, Spinner, Placeholder } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';


export default function Edit({ attributes, setAttributes }) {
    const {post} = attributes;
    const [searchKeyword, setSearchKeyword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // init and prepopulate posts
    useEffect(() => {
        getPosts();
    }, []);

    // reset
    const reset = () => {
        setPosts([]);
        setIsLoading(false);
        setTotalPages(1);
    };

    // fetch posts
    useEffect(() => {
        // if no search term, reset to default 
        if (!searchKeyword.trim()) {
            reset();
        }

        setIsLoading(true);

        const debounce = setTimeout(() => {
            getPosts(searchKeyword, page, perPage);
        }, 1000);

        return () => clearTimeout(debounce);
    }, [searchKeyword, page, perPage]);

    // get posts api request
    const getPosts = async (keyword = '', pageNum = page, per_page = perPage) => {
        const queryParams = {
            page: pageNum,
            per_page: per_page,
            status: 'publish',
            _fields: 'id,title,link'
        };

        // ensure keyword is set and is not a number
        // if so add keyword search param
        if (keyword && isNaN(keyword)) {
            queryParams.search = keyword;
        }

        // ensure keyword is set and is a number
        // if so delete params
        if (keyword && !isNaN(keyword)) {
            delete queryParams.page;
            delete queryParams.per_page;
        }

        try {
            const pathUrl = isNaN(keyword) ? `/wp/v2/posts` : `/wp/v2/posts/${keyword}`;
            const response = await apiFetch({ path: addQueryArgs( pathUrl, queryParams ), parse: false });
            const responseJSON = await response.json();
            const responsePosts = Array.isArray(responseJSON) ? responseJSON : [responseJSON];

            if (responsePosts) {
                setTotalPages(response.headers.get('X-WP-TotalPages') || 0);
            }

            setPosts(responsePosts);
        } catch (error) {
            console.log(error);
            setPosts([]);
        } finally  {
            setIsLoading(false);
        }
    };

    // search posts
    const searchPosts = (value) => {
        setSearchKeyword(value);
        setPosts([]);
        setPage(1);
    };

    // control and set page num
    const setPageNum = (value) => {
        let pageNum = parseInt(value);

        if (isNaN(pageNum) || pageNum < 1) {
            pageNum = 1;
        } else if (pageNum > totalPages) {
            pageNum = totalPages;
        }

        setPage(pageNum);
    };

    // control and set per page num
    const setPerPageNum = (value) => {
        let pagePerNum = parseInt(value);

        if (isNaN(pagePerNum) || pagePerNum < 1) {
            pagePerNum = 1;
        } else if (pagePerNum > 100) {
            pagePerNum = 100;
        }

        setPerPage(pagePerNum);
        setPage(1);
    };

    // list post select options
    let listPostOptions = [];

    if (posts.length) {
        listPostOptions.push({
            value: 0,
            label: "Select a post",
        });

        posts.forEach((item, index) => {
            listPostOptions.push({
                value: item.id,
                label: item.title.rendered
            })
        })
    }

    // handle post selection
    const handleSelectPost = (value) => {
        const selectedPost = posts.find(p => p.id === parseInt(value));

        if (!selectedPost) {
            // alert to user, clear post attr too
            alert("Please select a post");
        }

        setAttributes({post: selectedPost});
    }

    return (
        <>
            <InspectorControls>
                <PanelBody>
                    <TextControl
                        label="Search Posts"
                        help="Enter keyword or post ID"
                        value={searchKeyword}
                        onChange={searchPosts}
                    />
                    <TextControl
                        label="Page"
                        help={`Total pages found: ${totalPages}`}
                        value={page}
                        type="number"
                        min={1}
                        max={totalPages}
                        onChange={setPageNum}
                    />
                    <TextControl
                        label="Results to show"
                        help="Enter amount of posts to show"
                        value={perPage}
                        type="number"
                        min={0}
                        max={100}
                        onChange={setPerPageNum}
                    />
                    {isLoading && (
                        <Spinner />
                    )}
                    {posts.length > 0 ? (
                        <SelectControl
                            label="Select Post"
                            help="Click a post to set anchor link"
                            options={listPostOptions}
                            onChange={handleSelectPost}
                        />
                    ) : (
                        <p>No Posts Found</p>
                    )}
                </PanelBody>
            </InspectorControls>

            <div { ...useBlockProps() }>
                {post ? (
                    <p>
                        Read More: <a href={post.link} className="dmg-read-more">{post.title.rendered}</a>
                    </p>
                ) : (
                    <Placeholder
                        label="Read More"
                        instructions="Select post to insert anchor link"
                    />
                )}
            </div>
        </>
    );
}
